import {useEffect, useRef, useState, useContext} from "react"
import {Spores, SporesActions} from "@/utils/graphql/types"
import {querySporesByAddress, querySporeActionsBySporeIds} from "@/utils/graphql"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

export interface SporesWithChainInfo extends Spores {
    chain: 'btc' | 'ckb'
}

export default function useSpores(addresses: string[]) {
    const [data, setData] = useState<SporesWithChainInfo[]>([])
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [error, setError] = useState<undefined | any>(undefined)
    const [page, setPage] = useState(1)
    const [loaded, setLoaded] = useState(true)
    const {network} = useContext(CKBContext)
    const pageSize = 200

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
                const spores = await querySporesByAddress(addresses, page, pageSize, undefined, network === 'mainnet')
                const sporeActions = await querySporeActionsBySporeIds(spores.map((s: Spores) => s.spore_id), network === 'mainnet')
                const checkSporesburned = spores.filter((s: Spores) => {
                   const isBurned = sporeActions.some((a: SporesActions) => a.spore_id === s.spore_id && a.action_type === 'BurnSpore')
                   return !isBurned
                })
                setLoaded(spores.length < pageSize)
                const list = page === 1 ? checkSporesburned : [...data, ...checkSporesburned]
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
    }, [page, addresses])

    return {
        setPage: handleNextPage,
        page,
        data,
        status,
        error,
        loaded
    }
}
