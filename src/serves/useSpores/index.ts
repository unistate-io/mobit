import {useEffect, useRef, useState} from "react"
import {Spores} from "@/utils/graphql/types"
import {querySporesByAddress} from "@/utils/graphql"

export interface SporesWithChainInfo extends Spores {
    chain: 'btc' | 'ckb'
}

export default function useSpores(addresses: string[]) {
    const [data, setData] = useState<SporesWithChainInfo[]>([])
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [error, setError] = useState<undefined | any>(undefined)
    const [page, setPage] = useState(1)
    const [loaded, setLoaded] = useState(false)
    const pageSize = 3

    const historyRef = useRef('')

    const handleNextPage = (page: number) => {
        if (status !== 'loading') {
            setPage(page)
        }
    }

    useEffect(() => {
        if (!addresses || !addresses.length) return
        if (historyRef.current !== addresses.join(',')) {
            historyRef.current = addresses.join(',')
            setPage(1)
            return
        }
    }, [addresses])

    useEffect(() => {
        if (page === 1) {
            setStatus('loading')
        }

        (async () => {
            try {
                const spores = await querySporesByAddress(addresses, page, pageSize)
                setLoaded(spores.length < pageSize)
                const list = page === 1 ? spores : [...data, ...spores]
                setData(list.map((s: Spores) => {
                    return {
                        ...s,
                        chain: 'ckb'
                    }
                }))
                setStatus('complete')
            } catch (e: any) {
                console.error(e)
                setData([])
                setStatus('error')
                setLoaded(true)
                setError(e)
            }
        })()
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
