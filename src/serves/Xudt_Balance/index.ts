import {gqls, queryTokenInfo, queryXudtCell, query} from "@/utils/graphql/index";
// @ts-ignore
import BigNumber from "bignumber.js";

export const balance = async (address: string) => {
    const cells = await queryXudtCell(address)
    console.log('cells', cells)

    if (cells.length === 0) {
        console.log('enpty')
        return []
    }

    let typed_id: string[] = []
    cells.forEach(c => {
        if (!typed_id.includes(c.type_id)) {
            typed_id.push(c.type_id)
        }
    })
    console.log('typed_id', typed_id)

    const tokensInfo = await queryTokenInfo(typed_id)
    console.log('tokenInfo', tokensInfo)

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
    console.log('status_cell_doc', status_cell_doc)

    const status_cells: any = await query(status_cell_doc)
    console.log('status_cells', status_cells)

    const valid_cell = cells.filter(((c, index) => {
        return !status_cells['c' + index].length
    }))

    console.log('valid_cell', valid_cell)

    const res = tokensInfo.map(t => {
        const target_cells = valid_cell.filter(vc => {
            return vc.type_id === t.type_id
        })

        const sum = target_cells.reduce((prev, cur, index, ) => {
            return prev.plus(BigNumber(cur.amount))
        }, BigNumber(0) )

        return {
            name: t.name,
            symbol: t.symbol,
            decimal: t.decimal,
            type_id: t.type_id,
            amount: sum.toString()
        }
    })

    console.log('res', res)
    return res
}
