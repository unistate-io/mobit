import {useEffect, useState} from "react";
import {Spores} from "@/utils/graphql/types";
import {querySporesByAddress} from "@/utils/graphql";

export default function useSpores(address: string) {
    const [data, setData] = useState<Spores[]>([])
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [error, setError] = useState<undefined | any>(undefined)
    const [page, setPage] = useState(1)
    const [loaded, setLoaded] = useState(false)
    const pageSize = 3

    useEffect(() => {
        setPage(1)
    }, [address])

    useEffect(() => {
        if (page === 1) {
            setStatus('loading')
        }

        querySporesByAddress(address, page, pageSize)
            .then(res => {
                setLoaded(res.length < pageSize)
                setData(page === 1 ? res : [...data, ...res])
                setStatus('complete')
            })
            .catch((e: any) => {
                console.error(e)
                setData([])
                setStatus('error')
                setLoaded(true)
                setError(e)
            })
    }, [page])

    return {
        setPage,
        page,
        data,
        status,
        error,
        loaded
    }
}
