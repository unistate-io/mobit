import {useEffect, useState} from "react";
import {queryClustersByIds, querySporesById} from "@/utils/graphql";
import {Clusters, Spores} from "@/utils/graphql/types";
import {bufferToRawString} from "@spore-sdk/core";

export interface SporeDetail extends Spores {
    dob0?: {
        dob_content: {dna : string, id: string}
        render_output: [{
            name: string,
            traits:[{String?: string, Number?: string}]
        }],
    }
    json?: {name: string, resource : {type: string, url: string}}
    plant_text?: string
    cluster?:Clusters
}

function decodeBob0(tokenid: string) {
    return new Promise((resolve, reject) => {
        fetch(`https://dob-decoder.rgbpp.io/`, {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json',
            },
            body: JSON.stringify({
                id: 2,
                jsonrpc: '2.0',
                method: 'dob_decode',
                params: [tokenid]
            })
        })
            .then(res => {
                return res.json()
            }).then(res => {
            resolve(JSON.parse(res.result))
        })
            .catch((e: any) => {
                reject(e)
            })
    })
}


export default function useSporeDetail(tokenid: string) {
    const [status, setStatus] = useState<'loading' | 'error' | 'complete'>('loading')
    const [data, setData] = useState<SporeDetail | null>(null)
    const [error, setError] = useState<undefined | any>(undefined)

    useEffect(() => {
        (async () => {
            const spore = await querySporesById(`\\\\x${tokenid}`)
            console.log('spore', spore)
            if (!spore) {
                setStatus("complete")
            } else {
                let res: SporeDetail = spore

                let cluster: Clusters | undefined = undefined

                if (spore.cluster_id) {
                    cluster = await queryClustersByIds(spore.cluster_id)
                }

                if (spore.content_type === 'dob/0') {
                    const decode:any = await decodeBob0(tokenid.replace('0x', ''))
                    console.log('decode', decode)
                    res = {
                        ...spore,
                        dob0: {
                            dob_content: decode.dob_content,
                            render_output: JSON.parse(decode.render_output)
                        },
                    }
                } else if (spore.content_type === 'application/json') {
                    const decode:any = JSON.parse(bufferToRawString(spore.content.replace('\\', '0')))
                    res = {
                        ...spore,
                        json: decode,
                    }
                } else if (spore.content_type.includes('text')) {
                    res = {
                        ...spore,
                        plant_text: bufferToRawString(spore.content.replace('\\', '0')),
                    }
                }

                setStatus("complete")
                setData({
                    ...res,
                    cluster
                })

            }
        })()
    }, [tokenid])

    return {
        status,
        data,
        error
    }
}