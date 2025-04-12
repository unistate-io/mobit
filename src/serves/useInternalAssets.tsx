import {useState, useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {useEffect} from "react"
import {getInternalAddressChain} from "@/utils/common"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {MarketContext} from "@/providers/MarketProvider/MarketProvider"

export const SupportedChainMetadata = [
    {
        chain: "eth-mainnet",
        name: "Ethereum",
        tokenSymbol: "ETH"
    },
    {
        chain: "base-mainnet",
        tokenSymbol: "BASE",
        name: "Base"
    },
    {
        chain: "polygon-mainnet",
        tokenSymbol: "MATIC",
        name: "Matic"
    },
    {
        chain: "arb-mainnet",
        tokenSymbol: "ARB",
        name: "Arbitrum"
    },
    {
        chain: "opt-mainnet",
        tokenSymbol: "OP",
        name: "Optimism"
    }
]

export interface InternalTokenBalance extends TokenBalance {
    assets_chain: string,
    assets_icon?: string,
    contract_address?: string,
}

export default function useInternalAssets(walletAddress?: string) {
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [error, setError] = useState<undefined | any>(undefined)
    const {network} = useContext(CKBContext)
    const [data, setData] = useState<InternalTokenBalance[]>([])
    const {setInternalAssetsMarket} = useContext(MarketContext)

    const getInternalErc20Assets = async (chain: string): Promise<{
        balance: InternalTokenBalance[],
        markets: {[index: string]: any}
    }> => {
        if (network === "testnet") return {balance: [], markets: {}}
        if (chain === "evm") {
            const data = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/tokens_balance`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(
                        {
                            address: walletAddress!,
                            networks: SupportedChainMetadata.map((chain) => chain.chain)
                        }
                    )
                })

            if (!data.ok) {
                throw new Error(`Failed to fetch tokens for ${data.statusText}`)
            }

            const res = await data.json()
            const displayList = res.data.tokens
                .filter((item: any) => {
                    return BigInt(item.tokenBalance).toString() !== "0"
                        && item.tokenPrices?.length > 0
                        && Number(item.tokenPrices[0].value) > 0.0001
                })
            const displayTokenBalance = displayList.map((item: any) => {
                return {
                    decimal: item.tokenMetadata.decimals,
                    name: item.tokenMetadata.name,
                    symbol: item.tokenMetadata.symbol,
                    assets_icon: item.tokenMetadata.logo,
                    contract_address: item.tokenAddress,
                    type_id: "",
                    assets_chain: item.network,
                    address: {
                        id: "",
                        script_args: "",
                        script_code_hash: "",
                        script_hash_type: ""
                    },
                    addressByInscriptionId: null,
                    amount: BigInt(item.tokenBalance).toString(),
                    type: "erc20",
                    chain: "evm"
                }
            })
            const market: {[index: string]: any} = {}
            displayList.forEach((item: any) => {
                market[item.tokenMetadata.symbol] = item.tokenPrices[0].value
            })
            return {
                balance: displayTokenBalance,
                markets: market
            }
        } else {
            return {balance: [], markets: {}}
        }
    }

    const getInternalBalance = async (chain: string) => {
        if (network === "testnet") return []
        if (chain !== "evm") return []

        const data = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/balance`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(
                    {
                        address: walletAddress!,
                        networks: SupportedChainMetadata.map((chain) => chain.chain)
                    }
                )
            })

        if (!data.ok) {
            throw new Error(`Failed to fetch tokens for ${data.statusText}`)
        }

        const res: {chain: string, amount: string}[] = await data.json()

        const tokenBalance = res
            .map((b, index) => {
                // polygon mainnet => matic
                return {
                    decimal: 18,
                    name: SupportedChainMetadata[index].name,
                    symbol: SupportedChainMetadata[index].tokenSymbol,
                    type_id: "",
                    assets_chain: b.chain,
                    address: {
                        id: "",
                        script_args: "",
                        script_code_hash: "",
                        script_hash_type: ""
                    },
                    addressByInscriptionId: null,
                    amount: b.amount,
                    type: b.chain,
                    chain: "evm"
                } as InternalTokenBalance
            })
            .filter((b) => {
                return b.amount !== "0"
            })


        return tokenBalance
    }

    const getInternalTokenMarket = async (chain: string) => {
        if (network === "testnet") return {}
        if (chain !== "evm") return {}

        const res = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/market`, {
            method: "POST",
            headers: {accept: "application/json"},
            body: JSON.stringify({
                symbols: SupportedChainMetadata.map((chain) => chain.tokenSymbol)
            })
        })

        if (!res.ok) {
            throw new Error(`Failed to fetch tokens for ${res.statusText}`)
        }

        const data = await res.json()
        return data as {[index: string]: string}[]
    }


    useEffect(() => {
        ;(async () => {
            if (!walletAddress) {
                setStatus("complete")
            }
            const chain = getInternalAddressChain(walletAddress)
            if (!!chain && !!walletAddress) {
                try {
                    setStatus("loading")
                    const [erc20Balance, balance, internalTokenMarket] = await Promise.all([
                        getInternalErc20Assets(chain),
                        getInternalBalance(chain),
                        getInternalTokenMarket(chain)
                    ])
                    const markets = {...internalTokenMarket, ...erc20Balance.markets}
                    setInternalAssetsMarket(markets)
                    setData([...balance, ...erc20Balance.balance].sort((a, b) => {
                        // sort by chain
                        return a.assets_chain.localeCompare(b.assets_chain)
                    }))
                    setStatus("complete")
                } catch (e: any) {
                    console.error(e)
                    setError(e)
                    setStatus("error")
                }
            }
        })()
    }, [walletAddress])

    return {data, error, status}
}