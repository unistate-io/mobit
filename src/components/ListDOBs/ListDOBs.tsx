import {Spores} from "@/utils/graphql/types"
import {useEffect, useState} from "react"
import {bufferToRawString} from '@spore-sdk/core'
import {shortTransactionHash} from "@/utils/number_display"
import {Link} from "react-router-dom"
import {queryClustersByIds} from "@/utils/graphql";
import {renderByTokenKey, svgToBase64} from '@nervina-labs/dob-render'

export default function ListDOBs({
                                     data,
                                     onChangePage,
                                     status,
                                     loaded
                                 }: { data: Spores[], status: string, loaded: boolean, onChangePage?: (page: number) => any }) {
    const [page, setPage] = useState<number>(1)


    return <div className="shadow rounded-lg bg-white py-4">
        <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
            <div className="text-xl font-semibold">DOBs</div>
        </div>

        <div className="flex flex-col">
            {status === 'loading' &&
                <div className="mx-4 my-2">
                    <div className="loading-bg rounded-lg h-[30px] my-2"/>
                    <div className="loading-bg rounded-lg h-[30px] my-2"/>
                    <div className="loading-bg rounded-lg h-[30px] my-2"/>
                </div>
            }

            {
                data.length === 0 && status !== 'loading' &&
                <div
                    className="mx-4 h-[120px] flex flex-row justify-center items-center bg-gray-100 text-gray-300 rounded-xl">
                    No assets found
                </div>
            }

            <div className="flex flex-row flex-wrap px-2">
                {status !== 'loading' &&
                    data.map((item, index) => {
                        return <DOBItem item={item} key={item.id}/>
                    })
                }
            </div>


            {!loaded &&
                <div
                    onClick={() => {
                        setPage(page + 1);
                        onChangePage && onChangePage(page + 1)
                    }}
                    className="cursor-pointer hover:bg-gray-300 bg-gray-200 h-[40px] rounded-lg flex flex-row items-center justify-center mx-4 mt-2 text-xs">
                    {`View More`}
                </div>
            }
        </div>
    </div>
}

function DOBItem({item}: { item: Spores }) {
    const [image, setImage] = useState<string | null>(null)
    const [video, setVideo] = useState(null)
    const [name, setName] = useState('')
    const [plantText, setPlantText] = useState('')




    useEffect(() => {
        if (item.content_type === 'application/json') {
            try {
                const json = JSON.parse(bufferToRawString(item.content.replace('\\', '0')))
                console.log('application/json', json)
                if (json.name) {
                    setName(json.name)
                }

                if (json.resource?.type.includes('image')) {
                    const img = new Image()
                    img.src = json.resource.url
                    img.onload = () => {
                        setImage(json.resource.url)
                    }
                }

                if (json.resource?.type.includes('video')) {
                    setVideo(json.resource.url)
                }
            } catch (e: any) {
                console.error(e)
            }
        }

        if (item.content_type.includes('text/plain')) {
            setPlantText(bufferToRawString(item.content.replace('\\', '0')))
        }

        if (item.content_type.includes('dob/0')) {
            queryClustersByIds(item.cluster_id).then((clusters) => {
                if (clusters) {
                    setName(clusters.cluster_name)
                }
            })

            renderByTokenKey(item.id.replace('\\', '').replace('x', ''))
                .then(async (res) => {
                    setImage(await svgToBase64(res))
                })
                .catch((e: any) => {
                    console.warn(e)
                })
        }
        console.log('item', item)
    }, [item])


    return <Link to={`/dob/${item.id.replace('\\', '').replace('x', '')}`} className="shrink-0 grow-0 max-w-[50%] basis-1/2 md:basis-1/3 md:max-w-[33.3%] box-border p-2">
        <div
            className="w-full h-[140px] sm:h-[200px] md:h-[250px] lg:h-[180px]  overflow-hidden rounded-sm relative border border-1">
            <img className="object-cover w-full h-full"
                 src={image || "https://explorer.nervos.org/images/spore_placeholder.svg"} alt=""/>
        </div>
        <div
            className="mt-1 text-base font-semibold whitespace-nowrap overflow-hidden overflow-ellipsis h-[24px]">{name || plantText}</div>
        <div className="text-xs">{shortTransactionHash(item.id.replace('\\', '0'))}</div>
    </Link>
}
