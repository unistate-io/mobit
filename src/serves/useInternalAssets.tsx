import {useState, useCallback, useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {useEffect} from "react"
import {getInternalAddressChain} from "@/utils/common"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {MarketContext} from "@/providers/MarketProvider/MarketProvider"
import {Network, Alchemy, Utils} from "alchemy-sdk"

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
        tokenSymbol: "POL",
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
            const opts = {
                addresses: [
                    {
                        address: walletAddress!,
                        networks: SupportedChainMetadata.map((chain) => chain.chain)
                    }
                ],
                withMetadata: true,
                withPrices: true
            }

            const data = await fetch(`https://api.g.alchemy.com/data/v1/${process.env.REACT_APP_ALCHEMY_API_KEY}/assets/tokens/by-address`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(opts)
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
                    type_id: "",
                    assets_chain: item.network.split("-")[0],
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

        const alchemyClients = SupportedChainMetadata.map(supportedChain => {
            return {
                chain: supportedChain.chain,
                client: new Alchemy({
                    apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
                    network: supportedChain.chain as Network
                })
            }
        })

        const balance = await Promise.all(alchemyClients.map(async client => {
            return client.client.core.getBalance(walletAddress!, "latest")
        }))

        const tokenBalance = balance
            .map((b, index) => {
                // polygon mainnet => matic
                const assets_chain = SupportedChainMetadata[index].chain === "polygon-mainnet"
                    ? "matic"
                    : SupportedChainMetadata[index].chain.split("-")[0]
                return {
                    decimal: 18,
                    name: SupportedChainMetadata[index].name,
                    symbol: SupportedChainMetadata[index].tokenSymbol,
                    type_id: "",
                    assets_chain: assets_chain,
                    address: {
                        id: "",
                        script_args: "",
                        script_code_hash: "",
                        script_hash_type: ""
                    },
                    addressByInscriptionId: null,
                    amount: b.toString(),
                    type: assets_chain,
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

        const options = {method: "GET", headers: {accept: "application/json"}}

        const res = await fetch(`https://api.g.alchemy.com/prices/v1/${process.env.REACT_APP_ALCHEMY_API_KEY}/tokens/by-symbol?symbols=ETH&symbols=OP&symbols=MATIC&symbols=BASE&symbols=ARB`, options)

        if (!res.ok) {
            throw new Error(`Failed to fetch tokens for ${res.statusText}`)
        }

        const data = await res.json()
        const market: {[index: string]: any} = {}
        data.data.forEach((item: any) => {
            market[item.symbol] = item.prices[0]?.value
        })
        return {...market, "BASE": market["ETH"], "POL": market["MATIC"]}
    }


    useEffect(() => {
        ;(async () => {
            if (!walletAddress) {
                setStatus('complete')
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