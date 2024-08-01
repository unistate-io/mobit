import {Client, Collector, Pool, PoolInfo} from '@utxoswap/swap-sdk-js'
import {useContext, useEffect, useMemo, useState} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

const apiKey = process.env.REACT_APP_UTXO_SWAP_KEY

export function useUtxoSwap() {
    const {config, network} = useContext(CKBContext)
    const collector = useMemo(() => new Collector({ckbIndexerUrl: config.ckb_indexer}), [config])
    const client = useMemo(() => new Client(network === 'mainnet', apiKey), [network])

    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [pools, setPools] = useState<PoolInfo[]>([])

    useEffect(() => {
        (async () => {
            const { list: pools } = await client.getPoolsByToken({
                pageNo: 0,
                pageSize: 100,
                searchKey: "0x0000000000000000000000000000000000000000000000000000000000000000",
            })

            console.log(pools)
            setPools(pools)
            setStatus('complete')
        })()
    }, [collector, client])

    return {client, collector, pools, status}
}
