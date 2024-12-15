import {useEffect, useState} from "react"
import {TransactionHistory} from "@/components/ListHistory/ListHistory"
import network_config from "@/providers/CKBProvider/network_config";

export default function useTransactions(address?: string, pageSize?: number) {
    const [data, setData] = useState<TransactionHistory[]>([])
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [error, setError] = useState<undefined | any>(undefined)
    const [page, setPage] = useState(1)
    const [loadAll, setLoadAll] = useState(false)
    const size = pageSize || 5

    useEffect(() => {
        setPage(1)
        setLoadAll(false)
    }, [address]);

    useEffect(() => {
        if (!address) {
            setData([])
            setStatus('complete')
            setError(undefined)
        } else {
            setStatus('loading')
            const config = address.startsWith('ckt') ? network_config['testnet'] : network_config['mainnet']
            fetch(`${config.explorer_api}/address_transactions/${address}?page=${page}&page_size=${size}&sort=time.desc`, {
                method: 'GET',
                headers: {
                    "Accept": 'application/vnd.api+json',
                    "Content-Type": 'application/vnd.api+json',
                }
            })
                .then(async (res) => {
                    const json = await res.json()
                    if (json.data) {
                        setData([...data, ...json.data])
                        setStatus('complete')

                        if (json.data.length < size) {
                            setLoadAll(true)
                        }
                    } else {
                        setData([])
                        setStatus('complete')
                    }
                })
                .catch((e: any) => {
                    console.warn(e)
                    setData([])
                    setStatus('error')
                    setError(e)
                })
        }
    }, [page])

    return {
        setPage,
        page,
        data,
        status,
        error,
        loadAll
    }
}
