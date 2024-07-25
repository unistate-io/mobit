import {queryTokenInfo, queryXudtCell} from "@/utils/graphql"
// @ts-ignore
import BigNumber from "bignumber.js"
import {useEffect, useState} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {Spores} from "@/utils/graphql/types";
import {SporesWithChainInfo} from "@/serves/useSpores";

const queryAssets = async (btcAddress: string):Promise<{
    xudts: TokenBalance[],
    dobs: SporesWithChainInfo[],
    btc: TokenBalance
}> => {
    const res = await fetch(`https://ckb-btc-api.deno.dev/?btcAddress=${btcAddress}`)
    const json = await res.json()

    const list = {
        xudts: [] as TokenBalance[],
        dobs:[] as SporesWithChainInfo[],
        btc: {
            decimal: 8,
            name: 'Bitcoin',
            symbol: 'BTC',
            type_id: '',
            amount: json.balance.total_satoshi,
            type: 'btc',
            chain: 'btc'
        } as TokenBalance
    }

    json.assets.forEach((t: any) => {
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
                chain: 'btc',
                spore_actions: []
            })
        }
    })

    return  list
}

const btcEmpty: TokenBalance = {
    decimal: 8,
    name: 'Bitcoin',
    symbol: 'BTC',
    type_id: '',
    amount: '0',
    type: 'btc',
    chain: 'btc'
}

export default function useLayer1Assets(btcAddress?: string) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [xudts, setXudts] = useState<TokenBalance[]>([])
    const [dobs, setDobs] = useState<SporesWithChainInfo[]>([])
    const [btc, setBtc] = useState<TokenBalance | undefined>(undefined)
    const [error, setError] = useState<undefined | any>(undefined)

    useEffect(() => {
        if (!btcAddress) {
            setStatus('complete')
            setXudts([])
            setDobs([])
            setBtc(undefined)
            return
        }

        setStatus('loading')
        setXudts([])
        queryAssets(btcAddress)
            .then(res => {
                setXudts(res.xudts)
                setDobs(res.dobs)
                setBtc(res.btc)
                setStatus('complete')
            })
            .catch((e: any) => {
                console.error(e)
                setStatus('error')
                setError(e)
            })
    }, [btcAddress])

    return {
        status,
        xudts,
        dobs,
        error,
        btc
    }
}
