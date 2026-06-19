import {Client, Collector, PoolInfo, Token} from "@utxoswap/swap-sdk-js"
import {useContext, useMemo, useState} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {useAsyncEffect} from "ahooks"

const apiKey = process.env.REACT_APP_UTXO_SWAP_KEY

export function useUtxoSwap() {
    const {config, network} = useContext(CKBContext)
    const collector = useMemo(() => new Collector({ckbIndexerUrl: config.ckb_indexer}), [config])
    const client = useMemo(() => new Client(network === "mainnet", apiKey), [network])

    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [pools, setPools] = useState<PoolInfo[]>([])
    const [supportTokens, setSupportTokens] = useState<Token[]>([])

    useAsyncEffect(async () => {
        try {
            const {list: pools} = await client.getPoolsByToken({
                pageNo: 0,
                pageSize: 100,
                searchKey: "0x0000000000000000000000000000000000000000000000000000000000000000"
            })

            setPools(pools)
            setStatus("complete")
            const set = new Set<Token>()
            pools.forEach(pool => {
                set.add(pool.assetX)
                set.add(pool.assetY)
            })

            setSupportTokens(Array.from(set))
        } catch (error) {
            console.log("getPoolsByToken >>>> error", error)
        }
    }, [collector, client])

    return {client, supportTokens, collector, pools, status}
}
