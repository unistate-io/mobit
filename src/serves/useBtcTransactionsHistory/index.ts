import {useEffect, useState, useContext} from "react"
import {RgbppSDK} from  "mobit-sdk"
import { BtcApiTransaction } from "@rgbpp-sdk/service"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

export const getBtcTransactionsHistory = async (address: string, isMainnet: boolean = true) => {
    const sdk = new RgbppSDK(isMainnet, isMainnet ? undefined : 'Testnet3')
    return await sdk.fetchTxsDetails(address) as BtcApiTransaction[]
}

export default function useBtcTransactionsHistory(address?: string) {
    const [data, setData] = useState<BtcTransaction[]>([])
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [error, setError] = useState<undefined | any>(undefined)
    const {network} = useContext(CKBContext)
    const [page, setPage] = useState(1)

    useEffect(() => {
        if (!address) {
            setData([])
            setStatus('complete')
            setError(undefined)
            return
        }

        (async () => {
            try {
                const res = await getBtcTransactionsHistory(address, network === 'mainnet')
                setData(res)
                setStatus('complete')
            } catch (e: any) {
                console.warn(e)
                setData([])
                setStatus('error')
                setError(e)
            }
        })()
    }, [address, network])


    return {
        setPage,
        page,
        data,
        status,
        error
    }
}

export type BtcTransaction = BtcApiTransaction
