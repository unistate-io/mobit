import BigNumber from "bignumber.js"
import {useEffect, useState, useContext} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {SporesWithChainInfo} from "@/serves/useSpores"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ProcessedSporeAction, ProcessedXudtCell, RgbppSDK} from "mobit-sdk"

const queryAssets = async (
    btcAddress: string,
    isMainnet: boolean = true
): Promise<{
    xudts: TokenBalance[]
    dobs: SporesWithChainInfo[]
    btc: TokenBalance
}> => {
    const sdk = new RgbppSDK(
        isMainnet ? "https://mainnet.unistate.io/v1/graphql" : "https://testnet.unistate.io/v1/graphql",
        isMainnet ? undefined : "Testnet3"
    )
    const json = await sdk.fetchAssetsAndQueryDetails(btcAddress)

    console.log("layer 1 assets", json)

    const list = {
        xudts: [] as TokenBalance[],
        dobs: [] as SporesWithChainInfo[],
        btc: {
            decimal: 8,
            name: "Bitcoin",
            symbol: "BTC",
            type_address_id: "",
            amount: json.balance.total_satoshi.toString(),
            type: "btc",
            chain: "btc",
            defining_tx_hash: "",
            defining_output_index: 0,
            block_number: "",
            tx_timestamp: "",
            addressByTypeId: {
                id: "",
                script_args: "",
                script_code_hash: "",
                script_hash_type: ""
            },
            addressByInscriptionId: null
        } as TokenBalance
    }

    if (json.assets.xudtCells.length) {
        let tokens: string[] = []
        json.assets.xudtCells.forEach((t: ProcessedXudtCell) => {
            if (!tokens.includes(t.type_address_id)) {
                tokens.push(t.type_address_id)
            }
        })

        tokens.forEach(t => {
            const cells = json.assets.xudtCells.filter((c: ProcessedXudtCell) => c.type_address_id === t)
            const balance = cells.reduce(
                (acc: BigNumber, c: ProcessedXudtCell) => acc.plus(new BigNumber(c.amount.toString())),
                new BigNumber(0)
            )
            const info = cells[0].token_info

            list.xudts.push({
                name: info?.name || "UNKNOWN ASSET",
                symbol: info?.symbol || "",
                decimal: info?.decimal || 0,
                type_address_id: cells[0].type_address_id,
                amount: balance.toString(),
                type: "xudt",
                chain: "btc",
                defining_tx_hash: "",
                defining_output_index: 0,
                block_number: "",
                tx_timestamp: "",
                address_by_type_address_id: cells[0].type_script
                    ? {
                          address_id: "",
                          script_args: cells[0].type_script.args,
                          script_code_hash: cells[0].type_script.code_hash,
                          script_hash_type: cells[0].type_script.hash_type
                      }
                    : undefined
            })
        })
    }

    if (json.assets.sporeActions && json.assets.sporeActions.length) {
        json.assets.sporeActions.forEach((t: ProcessedSporeAction) => {
            if (!t.spore_id) return

            list.dobs.push({
                spore_id: t.spore_id,
                content: "",
                cluster_id: t.cluster_id || undefined,
                is_burned: false,
                owner_address_id: t.to_address_id || "",
                content_type: "",
                created_at_block_number: "",
                created_at_output_index: 0,
                created_at_timestamp: t.tx_timestamp,
                created_at_tx_hash: "",
                last_updated_at_block_number: "",
                last_updated_at_timestamp: t.tx_timestamp,
                last_updated_at_tx_hash: "",
                type_address_id: "",
                address_by_owner_address_id: undefined,
                address_by_type_address_id: t.address_by_type_address_id,
                cluster: undefined,
                chain: "btc"
            } as SporesWithChainInfo)
        })
    }

    console.log("list", list)
    return list
}

export default function useLayer1Assets(btcAddress?: string, polling?: boolean) {
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [xudts, setXudts] = useState<TokenBalance[]>([])
    const [dobs, setDobs] = useState<SporesWithChainInfo[]>([])
    const [btc, setBtc] = useState<TokenBalance | undefined>(undefined)
    const [error, setError] = useState<undefined | any>(undefined)
    const {network} = useContext(CKBContext)

    const pollingInterval = 1000 * 30 // 30s 一次

    useEffect(() => {
        if (!btcAddress) {
            setStatus("complete")
            setXudts([])
            setDobs([])
            setBtc(undefined)
            return
        }

        setStatus("loading")
        setXudts([])
        queryAssets(btcAddress, network === "mainnet")
            .then(res => {
                setXudts(res.xudts.map(x => ({...x, symbol: x.symbol.toUpperCase()})))
                setDobs(res.dobs)
                setBtc(res.btc)
                setStatus("complete")
            })
            .catch((e: any) => {
                console.error(e)
                setStatus("complete")
                setXudts([])
                setDobs([])
                setBtc(undefined)
                setStatus("error")
                setError(e)
            })
    }, [btcAddress, network])

    useEffect(() => {
        if (polling) {
            const interval = setInterval(() => {
                if (btcAddress) {
                    queryAssets(btcAddress, network === "mainnet")
                        .then(res => {
                            setXudts(res.xudts.map(x => ({...x, symbol: x.symbol.toUpperCase()})))
                            setDobs(res.dobs)
                            setBtc(res.btc)
                        })
                        .catch((e: any) => {
                            console.error(e)
                        })
                }
            }, pollingInterval)
            return () => clearInterval(interval)
        }
    }, [polling, network, btcAddress, pollingInterval])

    return {
        status,
        xudts,
        dobs,
        error,
        btc
    }
}
