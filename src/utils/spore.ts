import {hexToBytes, toBigEndian} from "@nervosnetwork/ckb-sdk-utils"
import {SporesWithChainInfo} from "@/serves/useSpores"
import {bufferToRawString} from "@spore-sdk/core"
import {queryClustersByIds} from "@/utils/graphql"
import {renderByTokenKey, svgToBase64, config} from "@nervina-labs/dob-render"
import {ccc} from "@ckb-ccc/connector-react"

export const hexToUtf8 = (value: string = "") => {
    try {
        return new TextDecoder().decode(hexToBytes(value))
    } catch (error) {
        return value
    }
}

const hexToBase64 = (hexstring: string) => {
    const str = hexstring
        .match(/\w{2}/g)
        ?.map(a => {
            return String.fromCharCode(parseInt(a, 16))
        })
        .join("")
    if (!str) return ""
    return btoa(str)
}

// parse spore cluster data guideline: https://github.com/sporeprotocol/spore-sdk/blob/beta/docs/recipes/handle-cell-data.md
export function parseSporeClusterData(hexData: string) {
    const data = hexData.replace(/^0x/g, "")

    const nameOffset = Number(toBigEndian(`0x${data.slice(8, 16)}`)) * 2
    const descriptionOffset = Number(toBigEndian(`0x${data.slice(16, 24)}`)) * 2

    const name = hexToUtf8(`0x${data.slice(nameOffset + 8, descriptionOffset)}`)
    const description = hexToUtf8(`0x${data.slice(descriptionOffset + 8)}`)

    return {name, description}
}

// parse spore cell data guideline: https://github.com/sporeprotocol/spore-sdk/blob/beta/docs/recipes/handle-cell-data.md
export function parseSporeCellData(hexData: string) {
    const data = hexData.replace(/^0x/g, "")

    const contentTypeOffset = Number(toBigEndian(`0x${data.slice(8, 16)}`)) * 2
    const contentOffset = Number(toBigEndian(`0x${data.slice(16, 24)}`)) * 2
    const clusterIdOffset = Number(toBigEndian(`0x${data.slice(24, 32)}`)) * 2

    const contentType = hexToUtf8(`0x${data.slice(contentTypeOffset + 8, contentOffset)}`)
    const content = data.slice(contentOffset + 8, clusterIdOffset)
    const clusterId = `0x${data.slice(clusterIdOffset + 8)}`

    if (clusterId !== "0x") {
        return {contentType, content, clusterId}
    }

    return {contentType, content}
}

export const getImgFromSporeCell = (content: string, contentType: string) => {
    const DEFAULT_URL = "/images/spore_placeholder.svg"
    if (contentType.startsWith("image")) {
        const base64Data = hexToBase64(content)
        return `data:${contentType};base64,${base64Data}`
    }
    if (contentType === "application/json") {
        try {
            const raw: any = JSON.parse(hexToUtf8(`0x${content}`))
            if (raw?.resource?.type?.startsWith("image")) {
                return raw.resource?.url ?? DEFAULT_URL
            }
        } catch {
            return DEFAULT_URL
        }
    }
    return DEFAULT_URL
}

export const isDob0 = (item: { standard: string | null; cell: { data: string | null } | null }) => {
    if (item.standard !== "spore") return false
    if (!item.cell?.data) return false
    try {
        const parsed = parseSporeCellData(item.cell.data)
        return parsed.contentType === "dob/0"
    } catch {
        // ignore
    }
    return false
}

export interface DobRenderRes {
    name: string
    image: string
    video: string
    plantText: string
    description: string
    traits: { key: string; value: any }[]
    dna?: string
    id?: string
}

export const renderDob = async (item: SporesWithChainInfo, network: string) => {
    return new Promise<DobRenderRes>(async (resolve, reject) => {
        const res: DobRenderRes = {
            name: "",
            image: "/images/spore_placeholder.svg",
            description: "",
            video: "",
            plantText: "",
            traits: []
        }

        if (item.cluster_id) {
            const clusters = await queryClustersByIds(item.cluster_id, network === "mainnet")
            if (clusters) {
                res.name = clusters.cluster_name || ""

                if (clusters.cluster_description) {
                    if (clusters.cluster_description.startsWith("{")) {
                        const clusterDescription = JSON.parse(clusters.cluster_description)
                        res.description = clusterDescription.description || ""
                    } else {
                        res.description = clusters.cluster_description
                    }
                }
            }
        }

        if (item.content_type === "application/json") {
            try {
                const json = JSON.parse(bufferToRawString(item.content.replace("\\", "0")))
                if (json.resource?.type.includes("image")) {
                    const img = new Image()
                    img.src = json.resource.url
                    img.onload = () => {
                        res.image = json.resource.url
                        resolve(res)
                    }
                } else if (json.resource?.type.includes("video")) {
                    res.video = json.resource.url
                    resolve(res)
                } else {
                    resolve(res)
                }
            } catch (e: any) {
                console.error(e)
                reject(e)
            }
        } else if (item.content_type.includes("text/plain")) {
            res.plantText = bufferToRawString(item.content.replace("\\", "0"))
            resolve(res)
        } else if (item.content_type.includes("image")) {
            const data = item.content.replace("\\x", "")
            res.image = getImgFromSporeCell(data, item.content_type)
            resolve(res)
        } else if (item.content_type.includes("dob/0")) {
            try {
                const decoderUrl = network === 'mainnet'
                    ? 'https://dob-decoder.rgbpp.io/'
                    : 'https://dob0-decoder-dev.omiga.io'
                const tokenId = item.id.replace("\\", "").replace("x", "")
                const decode: any = await decodeBob0(tokenId, decoderUrl)
                res.traits = JSON.parse(decode.render_output)
                    .filter((trait: any) => {
                        return !trait.name.startsWith("prev.")
                    })
                    .map((trait: any) => {
                        const value = trait.traits[0].String
                            || trait.traits[0].string
                            || trait.traits[0].Number
                            || trait.traits[0].number
                            || trait.traits[0].Timestamp
                            || trait.traits[0].timestamp
                            || trait.traits[0].Date
                            || trait.traits[0].date
                            || trait.traits[0].boolean?.toString()
                            || trait.traits[0].Boolean?.toString()
                            || '--'
                        return {key: trait.name, value}
                    })
                res.dna = decode.dob_content.dna || ""
                res.id = decode.dob_content.id || ""

                config.setDobDecodeServerURL(decoderUrl)
                const svg = await renderByTokenKey(tokenId)
                res.image = await svgToBase64(svg)
                resolve(res)
            } catch (e) {
                console.error(e)
                reject(e)
            }
        } else resolve(res)
    })
}

export function decodeBob0(tokenid: string, decoderUrl?: string) {
    const decoder = decoderUrl || "https://dob-decoder.rgbpp.io"

    return new Promise((resolve, reject) => {
        fetch(decoder, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: 2,
                jsonrpc: "2.0",
                method: "dob_decode",
                params: [tokenid]
            })
        })
            .then(res => {
                return res.json()
            })
            .then(res => {
                resolve(JSON.parse(res.result))
            })
            .catch((e: any) => {
                reject(e)
            })
    })
}

export interface SporeDataView {
    contentType: string
    content: ccc.BytesLike
    clusterId?: ccc.HexLike
}
