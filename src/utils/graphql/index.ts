// @ts-ignore
import {request} from 'graphql-request'
import {gql, gqls as _gqls} from "@/utils/graphql/schema";
import {XudtCell, TokenInfo, Spores, Clusters, TokenInfoWithAddress} from "./types";

export const graphUrl = process.env.REACT_APP_GRAPH_URL!
export const gqls = _gqls

export const query = async (query: string, variables?: any) => {
    return await request(graphUrl, query, variables)
}

export const queryXudtCell = async (addresses: string[]) => {
    const doc = gql('xudt_cell', `where:{lock_id: {_in: ${JSON.stringify(addresses)}},  is_consumed: {_eq: false}}`)
    const res: any = await query(doc)
    return res.xudt_cell as XudtCell[]
}

export const queryAddressInfoWithAddress = async (type_ids: string[]) => {
    const idStr = type_ids.map(id => `"${id}"`).join(',')
    const doc = gql('token_info_address', `where:{type_id: {_in: [${idStr}]}}`)
    const res: any = await query(doc)
    return res.token_info as TokenInfoWithAddress[]
}

export const queryTokenInfo = async (type_ids: string[]) => {
    return await queryAddressInfoWithAddress(type_ids)
}

export const querySporesByAddress = async (addresses: string[], page: number, pageSize:number, allowBurned?: boolean) => {
    const condition = allowBurned ? `where: {owner_address: {_in: ${JSON.stringify(addresses)}}, limit: ${pageSize}, offset: ${(page - 1) * pageSize}` : `where: {owner_address: {_in: ${JSON.stringify(addresses)}}, is_burned: {_eq: false}}, limit: ${pageSize}, offset: ${(page - 1) * pageSize}`
    const doc = gql('spores', condition)
    const res: any = await query(doc)
    return res.spores as Spores[]
}

export const querySporesById = async (id: string) => {
    const condition = `where: {id: {_eq: "${id}"}}`
    const doc = gql('spores', condition)
    const res: any = await query(doc)
    return res.spores[0] as Spores || null
}

export const queryClustersByIds = async (id: string) => {
    const doc = gql('clusters', `where: {id: {_eq: "${'\\' + id}"}}`)
    const res: {clusters: Clusters[]} = await query(doc)
    return res.clusters[0] || null
}

