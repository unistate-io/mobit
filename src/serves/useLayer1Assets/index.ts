import {queryTokenInfo, queryXudtCell} from "@/utils/graphql"
// @ts-ignore
import BigNumber from "bignumber.js"
import {useEffect, useState} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {Spores} from "@/utils/graphql/types";
import {SporesWithChainInfo} from "@/serves/useSpores";


interface AssetDetails {
    xudtCell?: any;
    sporeActions?: any;
}

interface QueryResult {
    balance: any;
    assets: AssetDetails;
}

const queryAssets = async (btcAddress: string):Promise<{
    xudts: TokenBalance[],
    dobs: SporesWithChainInfo[],
    btc: TokenBalance
}> => {
    const res = await fetch(`https://ckb-btc-api--refactor.deno.dev/?btcAddress=${btcAddress}`)
    const json = await res.json() as QueryResult

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

    if (json.assets.xudtCell && json.assets.xudtCell.length) {
        json.assets.xudtCell.forEach((t: any) => {
            list.xudts.push({
                name: t.addressByTypeId.token_info.name,
                symbol: t.addressByTypeId.token_info.symbol,
                decimal: t.addressByTypeId.token_info.decimal,
                type_id: t.type_id,
                amount: t.amount,
                type: 'xudt',
                chain: 'btc',
                address: {
                    id: '',
                    script_args: t.addressByTypeId.script_args,
                    script_code_hash: '',
                    script_hash_type: ''
                }
            })
        })
    }

    if (json.assets.sporeActions && json.assets.sporeActions.length) {
        json.assets.sporeActions.forEach((t: any) => {
            list.dobs.push({
                id: t.spore.id,
                content: t.spore.content,
                cluster_id: t.spore.cluster_id,
                is_burned: t.spore.is_burned,
                owner_address: t.spore.owner_address,
                content_type: t.spore.content_type,
                created_at: t.spore.created_at,
                updated_at: t.spore.updated_at,
                chain: 'btc'
            })
        })
    }

    return  list
}

const btcEmpty: TokenBalance = {
    decimal: 8,
    name: 'Bitcoin',
    symbol: 'BTC',
    type_id: '',
    amount: '0',
    type: 'btc',
    chain: 'btc',
    address: {
        id: '',
        script_args: '',
        script_code_hash: '',
        script_hash_type: ''
    }
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
                setStatus('complete')
                setXudts([])
                setDobs([])
                setBtc(undefined)
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
