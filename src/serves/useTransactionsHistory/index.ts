import {useEffect, useState} from "react";
import {TransactionHistory} from "@/components/ListHistory/ListHistory";

const api = process.env.REACT_APP_EXPLORER_API!

export default function useTransactions(address?: string, pageSize?: number) {
    const [data, setData] = useState<TransactionHistory[]>([])
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [error, setError] = useState<undefined | any>(undefined)
    const [page, setPage] = useState(1)
    const size = pageSize || 5

    useEffect(() => {
        if (!address) {
            setData([])
            setStatus('complete')
            setError(undefined)
        } else {
            setStatus('loading')
            setData([])
            fetch(`${api}/address_transactions/${address}?page=${page}&page_size=${size}&sort=time.desc`, {
                method: 'GET',
                headers: {
                    "Accept": 'application/vnd.api+json',
                    "Content-Type": 'application/vnd.api+json',
                }
            })
                .then(async (res) => {
                    const json = await res.json()
                    console.log('json', json)
                    if (json.data) {
                        console.log('here')
                        setData(json.data)
                        setStatus('complete')
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
    }, [address, page])


    return {
        setPage,
        page,
        data,
        status,
        error
    }
}
