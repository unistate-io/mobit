// @ts-ignore
import {request} from "graphql-request"
import {gql} from "@/utils/graphql/schema"
import {XudtCell, Spores, Clusters, TokenInfoWithAddress} from "./types" // Added TransactionOutputStatus

const api = {
    mainnet: "https://mainnet.unistate.io/v1/graphql",
    testnet: "https://testnet.unistate.io/v1/graphql"
}

// Helper to format bytea for query strings if needed
const formatByteaVariable = (hex: string) => JSON.stringify(hex)

export const query = async (query: string, variables?: any, isMainnet: boolean = true): Promise<any> => {
    const graphUrl = isMainnet ? api.mainnet : api.testnet
    return await request(graphUrl, query, variables)
}

export const queryXudtCell = async (addresses: string[], isMainnet: boolean = true): Promise<XudtCell[]> => {
    const condition = `where: {
      lock_address_id: {_in: ${JSON.stringify(addresses)}},
      consumption_status: {consumed_by_tx_hash: {_is_null: true}}
    }`
    const doc = gql("xudt_cells", condition)
    const res: any = await query(doc, undefined, isMainnet)
    return res.xudt_cells as XudtCell[]
}

export const queryAddressInfoWithAddress = async (
    type_address_ids: string[],
    isMainnet = true
): Promise<TokenInfoWithAddress[]> => {
    const condition = `where: { type_address_id: { _in: ${JSON.stringify(type_address_ids)} } }`
    const doc = gql("token_info_with_details", condition)
    const res: any = await query(doc, undefined, isMainnet)
    return res.token_info as TokenInfoWithAddress[]
}

export const querySporesByAddress = async (
    addresses: string[],
    page: number,
    pageSize: number,
    allowBurned: boolean = false,
    isMainnet = true
): Promise<Spores[]> => {
    let whereClause = `{ owner_address_id: { _in: ${JSON.stringify(addresses)} }`
    if (!allowBurned) {
        whereClause += `, is_burned: { _eq: false }`
    }
    whereClause += `}`

    const condition = `
      where: ${whereClause},
      limit: ${pageSize},
      offset: ${(page - 1) * pageSize},
      order_by: { created_at_timestamp: desc }
    `
    const doc = gql("spores", condition)
    const res: any = await query(doc, undefined, isMainnet)
    return res.spores as Spores[]
}

export const querySporesById = async (id: string, isMainnet = true): Promise<Spores | null> => {
    const condition = `where: { spore_id: { _eq: ${formatByteaVariable(id)} } }`
    const doc = gql("spores", condition)
    const res: any = await query(doc, undefined, isMainnet)
    return res.spores && res.spores.length > 0 ? (res.spores[0] as Spores) : null
}

export const queryClustersByIds = async (id: string, isMainnet = true): Promise<Clusters | null> => {
    const condition = `where: { cluster_id: { _eq: ${formatByteaVariable(id)} } }`
    const doc = gql("clusters", condition)
    const res: {clusters: Clusters[]} = await query(doc, undefined, isMainnet)
    return res.clusters && res.clusters.length > 0 ? res.clusters[0] : null
}
