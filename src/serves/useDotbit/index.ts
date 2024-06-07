import {useEffect, useState} from "react"
import {BitAccountListItem} from "dotbit/src/fetchers/BitIndexer.type"

import {CoinType, createInstance} from 'dotbit'

const dotbit = createInstance()

export default function useDotbit(owner: string) {
    const [data, setData] = useState<BitAccountListItem[]>([])
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>("loading")
    const [error, setError] = useState<any | null>(null)

    useEffect(() => {
        if (!owner) {
            setStatus("complete")
            setError(null)
            setData([])
            return
        }

        setStatus("loading")
        dotbit.accountsOfOwner({
            key: owner,
            coin_type: CoinType.CKB
        })
            .then((res) => {
                setData(res)
                console.log(res)
            })
            .catch((e: any) => {
                console.log(e)
                setStatus("error")
                setError(e)
            })
            .finally(() => {
                setStatus("complete")
            });
    }, [owner])

    return {
        data,
        status,
        error
    }
}
