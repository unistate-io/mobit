import TokenIcon from '../TokenIcon/TokenIcon'
import {useState} from "react"
import {toDisplay} from "@/utils/number_display"
import DialogXudtReceive from "@/components/Dialogs/DialogXudtReceive/DialogXudtReceive"
import DialogCkbTransfer from "@/components/Dialogs/DialogCkbTransfer/DialogCkbTransfer"
import {Link} from "react-router-dom"
import {TokenInfo} from "@/utils/graphql/types"
import DialogXudtTransfer from "@/components/Dialogs/DialogXudtTransfer/DialogXudtTransfer"

export interface TokenBalance extends TokenInfo  {
    amount: string,
    type: string,
}

export default function ListToken({
                                      data,
                                      status,
                                      address,
                                      previewSize = 5
                                  }: { data: TokenBalance[], status: string, address?: string, previewSize?: number }) {
    const [compact, setCompact] = useState(true)

    let list = data
    if (compact) {
        list = data.slice(0, previewSize)
    }

    return <div className="shadow rounded-lg bg-white py-4">
        <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
            <div className="text-xl font-semibold">Tokens</div>
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

            {data.length !== 0 && status !== 'loading' &&
                <div className="flex flex-row flex-nowrap px-2 md:px-4 py-3 text-xs box-border">
                    <div className="shrink-0 basis-1/3 md:basis-1/4">Asset</div>
                    {
                        !!address ?
                            <>
                                <div className="shrink-0 flex-1">Balance</div>
                                <div className="shrink-0 basis-1/3 md:basis-1/4 text-right">Action</div>
                            </> : <div className="shrink-0 flex-1 text-right">Balance</div>
                    }
                </div>
            }

            {status !== 'loading' &&
                list.map((item, index) => {
                    return <Link to={item.symbol ==='CKB' ? '/token' : `/token/${item.type_id}`} key={index} className="flex flex-row flex-nowrap px-2 md:px-4 py-3 text-xs box-border hover:bg-gray-100">
                        <div className="shrink-0 basis-1/3 md:basis-1/4 flex-row flex items-center">
                            <TokenIcon symbol={item.symbol!} size={24} chain={'ckb'}/>{item.symbol!}
                        </div>


                        {!!address ?
                            <>
                                <div
                                    className="shrink-0 flex-1 flex-row flex items-center">{toDisplay(item.amount, item.decimal!, true)}</div>
                                <div
                                    onClick={e => {e.preventDefault()}}
                                    className="shrink-0 basis-1/3 md:basis-1/4 text-right flex-row items-center flex flex-nowrap justify-end">

                                   {
                                       item.symbol === 'CKB' &&
                                       <DialogCkbTransfer from={address}>
                                           <div
                                               className="cursor-pointer px-3 md:px-4 py-2 font-semibold text-xs bg-neutral-100 hover:bg-neutral-200 rounded-md shadow-sm justify-center items-center inline-flex md:mr-2 mr-1">
                                               Send
                                           </div>
                                       </DialogCkbTransfer>
                                   }

                                    {
                                        item.symbol !== 'CKB' &&
                                        <DialogXudtTransfer from={address} token={item}>
                                            <div
                                                className="cursor-pointer px-3 md:px-4 py-2 font-semibold text-xs bg-neutral-100 hover:bg-neutral-200 rounded-md shadow-sm justify-center items-center inline-flex md:mr-2 mr-1">
                                                Send
                                            </div>
                                        </DialogXudtTransfer>
                                    }

                                    <DialogXudtReceive address={address}>
                                        <div
                                            className="cursor-pointer px-3 md:px-4 py-2 font-semibold text-xs bg-neutral-100 hover:bg-neutral-200 rounded-md shadow-sm justify-center items-center inline-flex">
                                            Receive
                                        </div>
                                    </DialogXudtReceive>


                                </div>
                            </> :  <div
                                className="shrink-0 flex-1 flex-row flex items-center justify-end">{toDisplay(item.amount, item.decimal!, true)}</div>
                        }
                    </Link>
                })
            }
        </div>

        {compact && data.length > previewSize &&
            <div
                onClick={() => setCompact(!compact)}
                className="cursor-pointer hover:bg-gray-300 bg-gray-200 h-[40px] rounded-lg flex flex-row items-center justify-center mx-4 mt-2 text-xs">
                {`View All (${data.length})`}
            </div>
        }
    </div>
}
