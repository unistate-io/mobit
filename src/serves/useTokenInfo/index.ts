import {useEffect, useState} from "react"
import {queryAddressInfoWithAddress} from "@/utils/graphql"
import {TokenInfoWithAddress} from "@/utils/graphql/types"

export default function useTokenInfo(tokenId: string) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenInfoWithAddress | null>(null)
    const [error, setError] = useState<undefined | any>(undefined)

    useEffect(() => {
        setStatus('loading')
        queryAddressInfoWithAddress([tokenId])
            .then(res => {
                if (!!res[0]) {
                    setData(res[0])
                }
                setStatus('complete')
            })
            .catch((e: any) => {
                setError(e)
                setStatus('error')
            })
    }, [tokenId])

    return {
        data,
        status,
        error
    }
}
