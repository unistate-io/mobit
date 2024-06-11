import {useEffect, useState} from "react";
import {queryTokenInfo} from "@/utils/graphql";
import {TokenInfo} from "@/utils/graphql/types";

export default function useTokenInfo(tokenId: string) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenInfo | null>(null)
    const [error, setError] = useState<undefined | any>(undefined)

    useEffect(() => {
        setStatus('loading')
        queryTokenInfo([tokenId])
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
