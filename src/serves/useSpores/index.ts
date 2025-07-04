import {useEffect, useRef, useState, useContext, useMemo} from "react"
import {Spores, SporesActions} from "@/utils/graphql/types"
import {querySporesByAddress, querySporeActionsBySporeIds} from "@/utils/graphql"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

export interface SporesWithChainInfo extends Spores {
    chain: "btc" | "ckb"
}

export default function useSpores(addresses: string[]) {
    const [data, setData] = useState<SporesWithChainInfo[]>([])
    const [displayData, setDisplayData] = useState<SporesWithChainInfo[]>([])
    const [fetched, setFetched] = useState(false)
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [error, setError] = useState<undefined | any>(undefined)
    const [page, setPage] = useState(1)
    const loaded = useMemo(() => {
        return displayData.length === data.length && fetched
    }, [displayData, data, fetched])

    const {network} = useContext(CKBContext)
    const pageSize = 3

    const historyRef = useRef("")

    const handleNextPage = (page: number) => {
        if (status !== "loading") {
            setPage(page)
        }
    }

    useEffect(() => {
        if (!addresses || !addresses.length) return
        if (historyRef.current !== addresses.join(",")) {
            historyRef.current = addresses.join(",")
            setPage(1)
            return
        }
    }, [addresses])

    useEffect(() => {
        if (page === 1) {
            setStatus("loading")
        }

        ;(async () => {
            try {
                let _data = [...data]
                if (!fetched) {
                    const spores = await querySporesByAddress(
                        addresses,
                        1,
                        200,
                        undefined,
                        network === "mainnet"
                    )
                    const sporeActions = await querySporeActionsBySporeIds(
                        spores.map((s: Spores) => s.spore_id),
                        network === "mainnet"
                    )
                    const checkSporesburned = spores.filter((s: Spores) => {
                        const isBurned = sporeActions.some(
                            (a: SporesActions) => a.spore_id === s.spore_id && a.action_type === "BurnSpore"
                        )
                        return !isBurned
                    })
                    const res = checkSporesburned.map((s: Spores) => {
                        return {
                            ...s,
                            chain: "ckb"
                        }
                    }) as SporesWithChainInfo[]
                    setData(res)
                    _data = res
                    setFetched(true)
                }

                setDisplayData(_data.slice(0, page * pageSize))
                setStatus("complete")
            } catch (e: any) {
                console.error(e)
                setData([])
                setStatus("error")
                setError(e)
            }
        })()
    }, [page, addresses])

    return {
        setPage: handleNextPage,
        page,
        data: displayData,
        status,
        error,
        loaded
    }
}
