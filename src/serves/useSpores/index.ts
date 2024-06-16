import {useEffect, useState} from "react";
import {Spores} from "@/utils/graphql/types";
import {querySporesByAddress} from "@/utils/graphql";

export interface SporesWithChainInfo extends Spores {
    chain: 'btc' | 'ckb'
}

export default function useSpores(address: string) {
    const [data, setData] = useState<SporesWithChainInfo[]>([])
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [error, setError] = useState<undefined | any>(undefined)
    const [page, setPage] = useState(1)
    const [loaded, setLoaded] = useState(false)
    const pageSize = 3

    const handleNextPage = (page: number) => {
        if (status !== 'loading') {
            setPage(page)
        }
    }

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
                const list = page === 1 ? res : [...data, ...res]
                setData(list.map((s: Spores) => {
                    return {
                        ...s,
                        chain: 'ckb'
                    }
                }))
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
        setPage: handleNextPage,
        page,
        data,
        status,
        error,
        loaded
    }
}
