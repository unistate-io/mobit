// @ts-ignore
import {request} from 'graphql-request'
import {gql, gqls as _gqls} from "@/utils/graphql/schema";
import {XudtCell, TokenInfo} from "./types";

export const graphUrl = process.env.REACT_APP_GRAPH_URL!
export const gqls = _gqls

export const query = async (query: string, variables?: any) => {
    return await request(graphUrl, query, variables)
}



export const queryXudtCell = async (address: string) => {
    const doc = gql('xudt_cell', `where:{lock_id: {_eq: "${address}"}}`)
    const res: any = await query(doc)
    return res.xudt_cell as XudtCell[]
}

export const queryTokenInfo = async (type_ids: string[]) => {
    const idStr = type_ids.map(id => `"${id}"`).join(',')
    const doc = gql('token_info', `where:{type_id: {_in: [${idStr}]}}`)
    const res: any = await query(doc)
    return res.token_info as TokenInfo[]
}
