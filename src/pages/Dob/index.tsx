import {useParams} from "react-router-dom"
import {useEffect, useState} from "react"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import useSporeDetail from "@/serves/useSporeDetail"
import {renderByTokenKey, svgToBase64} from "@nervina-labs/dob-render"
import CopyText from "@/components/CopyText/CopyText"
import {shortTransactionHash} from "@/utils/common"

export default function DobPage() {
    const {tokenid} = useParams()

    if (!tokenid) {
        throw new Error('tokenid needed')
    }


    const {status, data} = useSporeDetail(tokenid)
    const [image, setImage] = useState<string | null>(null)
    const [des, setDes] = useState<string>('')

    useEffect(() => {
        if (!data) return

        if (data?.dob0) {
            renderByTokenKey(`${tokenid}`)
                .then(async (res) => {
                    const url = await svgToBase64(res)
                    setImage(url)
                })
                .catch((e: any) => {
                })
        } else if (data?.json && data?.json?.resource.type.includes('image')) {
            setImage(data?.json?.resource.url)
        }

        if (data.cluster?.cluster_description) {
            setDes(JSON.parse(data.cluster?.cluster_description).description)
        }
    }, [data, tokenid])


    return <div className="max-w-[1044px] mx-auto px-3 py-8 flex md:flex-row flex-col flex-nowrap items-start">
        <div className="md:w-[320px] w-full shadow rounded-lg overflow-hidden">
            <div className="w-full h-[320px] relative">
                <img className="w-full h-full object-cover"
                     src={image || 'https://explorer.nervos.org/images/spore_placeholder.svg'} alt=""/>
            </div>

            <div className="p-4">

                {status === 'loading' &&
                    <>
                        <div className={'loading-bg h-[30px] mb-3 rounded-lg'}/>
                        <div className={'loading-bg h-[30px] mb-3 rounded-lg'}/>
                    </>
                }

                {status !== 'loading' && !!data &&
                    <>
                        <div className="font-semibold text-lg mb-3">{data.cluster?.cluster_name || data.plant_text || ''}</div>

                        <div className="flex flex-row justify-between text-sm">
                            {des}
                        </div>
                    </>
                }

            </div>
        </div>

        <div className="shadow flex-1 md:ml-6 rounded-lg px-5 py-3 w-full mt-4">
            <div className="font-semibold text-lg mb-4">Information</div>

            {status === 'loading' &&
                <>
                    <div className={'loading-bg h-[45px] mb-6 rounded-lg'}/>
                    <div className={'loading-bg h-[45px] mb-6 rounded-lg w-[80%]'}/>
                    <div className={'loading-bg h-[45px] mb-6 rounded-lg'}/>
                    <div className={'loading-bg h-[45px] mb-6 rounded-lg w-[80%]'}/>
                    <div className={'loading-bg h-[45px] mb-6 rounded-lg'}/>
                    <div className={'loading-bg h-[45px] mb-6 rounded-lg w-[80%]'}/>
                    <div className={'loading-bg h-[45px] mb-6 rounded-lg'}/>
                    <div className={'loading-bg h-[45px] mb-6 rounded-lg w-[80%]'}/>
                </>
            }

            {
                status !== 'loading' && data &&
                <>
                    <div className="text-sm mb-6">
                        <div className="text-sm mb-3">Chain</div>
                        <div className="flex flex-row items-center text-sm font-semibold">
                            <TokenIcon symbol={'CKB'} size={24}/>
                            CKB
                        </div>
                    </div>

                    <div className="text-sm mb-6">
                        <div className="text-sm mb-3">Type</div>
                        <div className="flex flex-row items-center text-sm font-semibold break-all">
                            {data.content_type}
                        </div>
                    </div>

                    <div className="text-sm mb-6">
                        <div className="text-sm mb-3">Token ID</div>
                        <div className="flex flex-row items-center text-sm font-semibold break-all"
                             title={`0x${tokenid}`}>
                            <CopyText copyText={`0x${tokenid}`}>{shortTransactionHash(`0x${tokenid}`, 10)}</CopyText>
                        </div>
                    </div>

                    <div className="text-sm mb-6">
                        <div className="text-sm mb-3">Owner</div>
                        <div className="flex flex-row items-center text-sm font-semibold break-all"
                             title={`0x${data.owner_address}`}>
                            <CopyText
                                copyText={data.owner_address}>{shortTransactionHash(data.owner_address, 10)}</CopyText>
                        </div>
                    </div>

                    {data.cluster_id &&
                        <div className="text-sm mb-6">
                            <div className="text-sm mb-3">Cluster ID</div>
                            <div className="flex flex-row items-center text-sm font-semibold break-all"
                                 title={'0' + data.cluster_id.replace('\\', '')}>
                                <CopyText copyText={'0' + data.cluster_id.replace('\\', '')}>
                                    {shortTransactionHash('0' + data.cluster_id.replace('\\', ''), 10)}
                                </CopyText>
                            </div>
                        </div>
                    }

                    {data.dob0?.dob_content &&
                        <>
                            <div className="text-sm mb-6">
                                <div className="text-sm mb-3">DNA</div>
                                <div
                                    className="flex flex-row items-center text-sm font-semibold break-all"> {data.dob0?.dob_content.dna}</div>
                            </div>

                            <div className="text-sm mb-6">
                                <div className="text-sm mb-3">ID</div>
                                <div className="flex flex-row items-center text-sm font-semibold break-all"> {data.dob0?.dob_content.id}</div>
                            </div>

                            {!!data.dob0?.render_output?.length &&
                                <div className="text-sm mb-6">
                                    <div className="text-sm mb-3">Traits</div>
                                    <div className="flex flex-row items-center flex-wrap justify-between">
                                        {
                                            data.dob0?.render_output.map((traits, index) => {
                                                return <div className="basis-1/3 max-w-[32%]  rounded-lg bg-gray-100 text-xs mb-3  flex-1  p-3" key={index}>
                                                    <div className="mb-2 text-gray-400 text-center">{traits.name.replace('prev.', '')}</div>
                                                    <div className="text-center text-sm font-semibold break-all whitespace-nowrap overflow-hidden overflow-ellipsis">{traits.traits[0].String || traits.traits[0].Number}</div>
                                                </div>
                                            })
                                        }
                                        <div></div>
                                    </div>
                                </div>
                            }
                        </>
                    }
                </>
            }

            {
                status === 'complete' && !data &&
                <div
                    className="rounded flex flex-row items-center justify-center h-[280px] bg-gray-100 font-semibold text-gray-400">
                    No data to show
                </div>
            }
        </div>

    </div>
}

