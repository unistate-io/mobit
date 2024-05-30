import {gqls, query, queryTokenInfo, queryXudtCell} from "@/utils/graphql";
// @ts-ignore
import BigNumber from "bignumber.js";
import {useEffect, useState} from "react";
import {TokenBalance} from "@/components/ListToken/ListToken";

export const balance = async (address: string): Promise<TokenBalance[]> => {
    const cells = await queryXudtCell(address)
    // console.log('cells', cells)

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
    // console.log('typed_ids', typed_ids)

    const tokensInfo = await queryTokenInfo(typed_ids)
    // console.log('tokenInfo', tokensInfo)

    let gqlOpt = [] as any[]
    cells.forEach((c, index) => {
        gqlOpt.push(
            {
                type: 'xudt_status_cell',
                key: 'c' + index,
                opt: `where: {transaction_hash: {_eq: "${'\\' + c.transaction_hash}"}, transaction_index: {_eq: "${c.transaction_index}"}}`
            }
        )
    })

    const status_cell_doc = gqls(gqlOpt)
    const status_cells: any = await query(status_cell_doc)
    // console.log('status_cells', status_cells)

    const valid_cell = cells.filter(((c, index) => {
        return !status_cells['c' + index].length
    }))
    // console.log('valid_cell', valid_cell)

    const res = typed_ids.map(t => {
        const target_cells = valid_cell.filter(vc => {
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
            type: 'xudt'
        }
    })

    // console.log('res', res)
    return res
}

export default function useXudtBalance(address: string) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenBalance[]>([])
    const [error, setError] = useState<undefined | any>(undefined)

    useEffect(() => {
        setStatus('loading')
        setData([])
        balance(address)
            .then(res => {
                setData(res)
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
        data,
        error
    }
}
