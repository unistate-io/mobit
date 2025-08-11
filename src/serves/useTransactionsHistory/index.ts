import {useEffect, useState} from "react"
import {TransactionHistory} from "@/components/ListHistory/ListHistory"
import network_config from "@/providers/CKBProvider/network_config";
import { CKBContext } from "@/providers/CKBProvider/CKBProvider";
import { useContext } from "react";

export default function useTransactions(address?: string, pageSize?: number) {
    const {config} = useContext(CKBContext)
    const [data, setData] = useState<TransactionHistory[]>([])
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [error, setError] = useState<undefined | any>(undefined)
    const [page, setPage] = useState(1)
    const [loadAll, setLoadAll] = useState(false)
    const size = pageSize || 5

    useEffect(() => {
        setPage(1)
        setLoadAll(false)
        console.log('btc address tx history: ', address)
    }, [address]);

    useEffect(() => {
        if (!address) {
            setData([])
            setStatus('complete')
            setError(undefined)
        } else {
            setStatus('loading')
            const url = `${config.explorer_api}/address_transactions/${address}?page=${page}&page_size=${size}&sort=time.desc`
            console.log('url', url)
            fetch(url, {
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
    }, [page, address])

    return {
        setPage,
        page,
        data,
        status,
        error,
        loadAll
    }
}
