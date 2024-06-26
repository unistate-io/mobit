import {queryTokenInfo, queryXudtCell} from "@/utils/graphql"
// @ts-ignore
import BigNumber from "bignumber.js"
import {useEffect, useState, useRef} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"

export const balance = async (addresses: string[]): Promise<TokenBalance[]> => {
    const cells = await queryXudtCell(addresses)

    if (cells.length === 0) {
        console.log('enpty')
        return []
    }

    let typed_ids: string[] = []
    cells.forEach(c => {
        if (!typed_ids.includes(c.type_id)) {
            typed_ids.push(c.type_id)
        }
    })

    const tokensInfo = await queryTokenInfo(typed_ids)

    const res = typed_ids.map(t => {
        const target_cells = cells.filter(vc => {
            return vc.type_id === t
        })

        const target_token = tokensInfo.find(token => {
            return token.type_id === t
        })

        const sum = target_cells.reduce((prev, cur, index,) => {
            return prev.plus(BigNumber(cur.amount))
        }, BigNumber(0))

        return {
            name: target_token ? target_token.name : 'Unknown Token',
            symbol: target_token ? target_token.symbol : '',
            decimal: target_token ? target_token.decimal : 0,
            type_id: t,
            amount: sum.toString(),
            type: 'xudt',
            chain: 'ckb'
        }
    })

    return res as TokenBalance[]
}

export default function useAllXudtBalance(addresses: string[]) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenBalance[]>([])
    const [error, setError] = useState<undefined | any>(undefined)

    const historyRef = useRef('')

    useEffect(() => {
        if (!addresses || !addresses.length ||  historyRef.current === addresses.join(',')) return
        historyRef.current = addresses.join(',')
        setStatus('loading')
        setData([]);

        (async () => {
            try {
                const res = await balance(addresses)
                setData(res)
                setStatus('complete')
            } catch (e: any) {
                console.error(e)
                setError(e)
                setStatus('error')
            }
        })()
    }, [addresses])

    return {
        status,
        data,
        error
    }
}
