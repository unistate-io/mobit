import {useEffect, useState, useContext} from "react"
import {querySporesById} from "@/utils/graphql"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {SporesWithChainInfo} from "@/serves/useSpores"
import {DobRenderRes, renderDob} from "@/utils/spore"

export interface SporeDetail extends SporesWithChainInfo {
    details: DobRenderRes
}

export default function useSporeDetail(tokenid: string, chain: 'ckb' | 'btc' = 'ckb') {
    const [status, setStatus] = useState<'loading' | 'error' | 'complete'>('loading')
    const [data, setData] = useState<SporeDetail | null>(null)
    const [error, setError] = useState<undefined | any>(undefined)
    const {network} = useContext(CKBContext)

    useEffect(() => {
        (async () => {
            const spore = await querySporesById(`\\x${tokenid}`, network === 'mainnet')
            if (!spore) {
                alert("spore not found")
                setStatus("complete")
            } else {
                setStatus("loading")
               const details = await renderDob({...spore, chain}, network)
                setData({
                    ...spore,
                    chain,
                    details
                })
                setStatus("complete")
            }
        })()
    }, [tokenid])

    return {
        status,
        data,
        error
    }
}
