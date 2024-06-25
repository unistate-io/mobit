import {BI, config as lumosCoinfig, helpers, Indexer} from '@ckb-lumos/lumos'
import {useCallback, useContext, useEffect, useRef, useState} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"

const cccLib: any = ccc

export async function getCapacities(address: string, indexer: Indexer): Promise<string> {

    try {
        const collector = indexer.collector({
            lock: helpers.parseAddress(address),
            type: 'empty'
        });

        let capacities = BI.from(0);
        for await (const cell of collector.collect()) {
            capacities = capacities.add(cell.cellOutput.capacity);
        }

        return capacities.toString();
    } catch (e: any) {
        if (e.message.includes('Invalid checksum')) {
            return '0'
        } else {
            throw e
        }
    }
}


export default function useCkbBalance(addresses?: string[]) {
    const { network, client} = useContext(CKBContext)
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenBalance | undefined>(undefined)
    const [error, setError] = useState<undefined | any>(undefined)

    const historyRef = useRef('')

    const refresh = useCallback(async () => {
        if (!addresses || !addresses.length || !client) return

        try {
            const client = network === 'testnet' ? new cccLib.ClientPublicTestnet() : new cccLib.ClientPublicMainnet()
            const _balance = await client.getBalance(addresses.map((address) => {
                return helpers.addressToScript(address)
            }))

            setData({
                name: 'Nervos CKB',
                symbol: 'CKB',
                decimal: 8,
                type_id: '',
                type: 'ckb',
                amount: _balance.toString(),
                chain: 'ckb'
            })
            setStatus('complete')
        } catch (e: any) {
            setError(e)
            setStatus('error')
        }
    }, [addresses, network])

    useEffect(() => {
        if (!!addresses && addresses.length > 0 && historyRef.current !== addresses.join(',')) {
            historyRef.current = addresses.join(',')
            setStatus('loading')
            setData(undefined)
            refresh()
        }
    }, [refresh, addresses, network])


    return {
        data,
        status,
        error,
        refresh
    }
}
