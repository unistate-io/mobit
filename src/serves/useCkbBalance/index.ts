import {BI, helpers, Indexer } from '@ckb-lumos/lumos'
import {useCallback, useEffect, useState} from "react";
import {TokenBalance} from "@/components/ListToken/ListToken";

const CKB_RPC_URL = process.env.REACT_APP_CKB_RPC_URL!
const CKB_INDEXER_URL = process.env.REACT_APP_CKB_INDEXER_URL!

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export async function getCapacities(address: string): Promise<string> {
    const collector = indexer.collector({
        lock: helpers.parseAddress(address),
    });

    let capacities = BI.from(0);
    for await (const cell of collector.collect()) {
        capacities = capacities.add(cell.cellOutput.capacity);
    }

    return capacities.toString();
}


export default function useCkbBalance(address: string) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenBalance | undefined>(undefined)
    const [error, setError] = useState<undefined | any>(undefined)


    const refresh = useCallback(async ()=>{
        try {
            const balance = await getCapacities(address)
            setData({
                name: 'Nervos CKB',
                symbol: 'CKB',
                decimal: 8,
                type_id: '',
                type: 'ckb',
                amount: balance
            })
            setStatus('complete')
        } catch (e: any) {
            setError(e)
            setStatus('error')
        }
    }, [address])

    useEffect(() => {
        setStatus('loading')
        setData(undefined)
        refresh()
    }, [refresh, address])


    return {
        data,
        status,
        error,
        refresh
    }
}
