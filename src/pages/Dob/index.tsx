import {useParams} from "react-router-dom";
import {useEffect} from "react";
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import useSporeDetail from "@/serves/useSporeDetail"

export default function DobPage() {
    const {tokenid} = useParams()

    if (!tokenid) {
        throw new Error('tokenid needed')
    }


    const {status, data} = useSporeDetail(tokenid)

    useEffect(() => {
        console.log('data', data)
    }, [data])


    return <div className="max-w-[1044px] mx-auto px-3 py-8 flex flex-row items-start">
        <div className="sm:w-[320px] shadow rounded-lg overflow-hidden">
            <div className="w-full h-[320px] relative">
                <img className="w-full h-full object-cover"
                     src="https://explorer.nervos.org/images/spore_placeholder.svg" alt=""/>
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
                        <div className="font-semibold text-lg mb-3">{'name'}</div>

                        <div className="flex flex-row justify-between text-sm">
                            {'des'}
                        </div>
                    </>
                }

            </div>
        </div>

        <div className="shadow flex-1 sm:ml-6 rounded-lg px-5 py-3">
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
                status != 'loading' && data &&
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
                        <div className="flex flex-row items-center text-sm font-semibold">
                            {data.content_type}
                        </div>
                    </div>

                    <div className="text-sm mb-6">
                        <div className="text-sm mb-3">Token id</div>
                        <div className="flex flex-row items-center text-sm font-semibold"> {tokenid}</div>
                    </div>

                    <div className="text-sm mb-6">
                        <div className="text-sm mb-3">Owner</div>
                        <div className="flex flex-row items-center text-sm font-semibold"> {'--'}</div>
                    </div>

                    <div className="text-sm mb-6">
                        <div className="text-sm mb-3">Cluster</div>
                        <div className="flex flex-row items-center text-sm font-semibold"> {tokenid}</div>
                    </div>

                    <div className="text-sm mb-6">
                        <div className="text-sm mb-3">DNA</div>
                        <div className="flex flex-row items-center text-sm font-semibold"> {tokenid}</div>
                    </div>

                    <div className="text-sm mb-6">
                        <div className="text-sm mb-3">Traits</div>
                        <div className="flex flex-row items-center text-sm font-semibold"> {tokenid}</div>
                    </div>
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

