import {BI, helpers, Indexer, config as lumosCoinfig } from '@ckb-lumos/lumos'
import {useCallback, useEffect, useState, useContext} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

export async function getCapacities(address: string, indexer: Indexer): Promise<string> {

    try {
        const collector = indexer.collector({
            lock: helpers.parseAddress(address),
        });

        let capacities = BI.from(0);
        for await (const cell of collector.collect()) {
            capacities = capacities.add(cell.cellOutput.capacity);
        }

        return capacities.toString();
    } catch (e: any) {
        if (e.message.includes('Invalid checksum')) {
            return  '0'
        } else {
            throw e
        }
    }
}


export default function useCkbBalance(address?: string) {
    const {config, network} = useContext(CKBContext)

    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenBalance | undefined>(undefined)
    const [error, setError] = useState<undefined | any>(undefined)




    const refresh = useCallback(async ()=>{
       if (!address) return
        const indexer = new Indexer(config.ckb_indexer, config.ckb_rpc);

        try {
            const balance = await getCapacities(address, indexer)
            setData({
                name: 'Nervos CKB',
                symbol: 'CKB',
                decimal: 8,
                type_id: '',
                type: 'ckb',
                amount: balance,
                chain: 'ckb'
            })
            setStatus('complete')
        } catch (e: any) {
            setError(e)
            setStatus('error')
        }
    }, [address, config])

    useEffect(() => {
       if (!!address) {
           setStatus('loading')
           setData(undefined)
           lumosCoinfig.initializeConfig(network==='testnet' ? lumosCoinfig.predefined.AGGRON4 : lumosCoinfig.predefined.LINA);
           refresh()
       }
    }, [refresh, address, network])


    return {
        data,
        status,
        error,
        refresh
    }
}
