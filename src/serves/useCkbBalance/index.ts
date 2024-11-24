import {config as lumosConfig, config as lumosCoinfig, helpers} from '@ckb-lumos/lumos'
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"

const cccLib: any = ccc

export default function useCkbBalance(addresses?: string[]) {
    const {client} = useContext(CKBContext)
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenBalance | undefined>(undefined)
    const [error, setError] = useState<undefined | any>(undefined)

    const historyRef = useRef('')

    const refresh = async () => {
        if (!addresses || !addresses.length || !client) {
            setStatus('complete')
            return
        }

        try {
            const network = addresses[0].startsWith('ckt') ? 'testnet' : 'mainnet'
            const scriptConfig = network === 'testnet' ? lumosConfig.TESTNET : lumosConfig.MAINNET
            const client = network === 'testnet' ? new cccLib.ClientPublicTestnet() : new cccLib.ClientPublicMainnet()
            const _balance = await client.getBalance(addresses.map((address) => {
                return helpers.addressToScript(address, {config: scriptConfig})
            }))

            setData({
                name: 'Nervos CKB',
                symbol: 'CKB',
                decimal: 8,
                type_id: '',
                type: 'ckb',
                amount: _balance.toString(),
                chain: 'ckb',
                address: {
                    id: '',
                    script_args: '',
                    script_code_hash: '',
                    script_hash_type: ''
                },
                addressByInscriptionId: null
            })
            setStatus('complete')
        } catch (e: any) {
            setError(e)
            setStatus('error')
        }
    }

    useEffect(() => {
        if (!!addresses && addresses.length > 0
            && historyRef.current !== addresses.join(',')
        ) {
            historyRef.current = addresses.join(',')
            setStatus('loading')
            setData(undefined)
            refresh()
        }
    }, [addresses])


    return {
        data,
        status,
        error,
        refresh
    }
}
