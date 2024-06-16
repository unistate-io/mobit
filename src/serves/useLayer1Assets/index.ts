import {queryTokenInfo, queryXudtCell} from "@/utils/graphql"
// @ts-ignore
import BigNumber from "bignumber.js"
import {useEffect, useState} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {Spores} from "@/utils/graphql/types";
import {SporesWithChainInfo} from "@/serves/useSpores";

const queryAssets = async (address: string):Promise<{
    xudts: TokenBalance[],
    dobs: SporesWithChainInfo[]
}> => {
    const res = await fetch(`https://ckb-btc-api.deno.dev/?btcAddress=${address}`)
    const json = await res.json()

    const list = {
        xudts: [] as TokenBalance[],
        dobs:[] as SporesWithChainInfo[]
    }

    json.forEach((t: any) => {
        if (!!t.xudtCell) {
            list.xudts.push({
                name: t.xudtCell.addressByTypeId.token_info.name,
                symbol: t.xudtCell.addressByTypeId.token_info.symbol,
                decimal: t.xudtCell.addressByTypeId.token_info.decimal,
                type_id: t.xudtCell.type_id,
                amount: t.xudtCell.amount,
                type: 'xudt',
                chain: 'btc'
            })
        } else {
            list.dobs.push({
                id: t.sporeActions[0].spore.id,
                content: t.sporeActions[0].spore.content,
                cluster_id: t.sporeActions[0].spore.cluster_id,
                is_burned: t.sporeActions[0].spore.is_burned,
                owner_address: t.sporeActions[0].spore.owner_address,
                content_type: t.sporeActions[0].spore.content_type,
                created_at: t.sporeActions[0].spore.created_at,
                updated_at: t.sporeActions[0].spore.updated_at,
                chain: 'btc'
            })
        }
    })

    console.log('list', list)
    return  list
}

export default function useLayer1Assets(address?: string) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [xudts, setXudts] = useState<TokenBalance[]>([])
    const [dobs, setDobs] = useState<SporesWithChainInfo[]>([])
    const [error, setError] = useState<undefined | any>(undefined)

    useEffect(() => {
        if (!address) {
            setStatus('complete')
            setXudts([])
            setDobs([])
            return
        }

        setStatus('loading')
        setXudts([])
        queryAssets(address)
            .then(res => {
                setXudts(res.xudts)
                setDobs(res.dobs)
                setStatus('complete')
            })
            .catch((e: any) => {
                console.error(e)
                setStatus('error')
                setError(e)
            })
    }, [address])

    return {
        status,
        xudts,
        dobs,
        error
    }
}
