import TokenIcon from '../TokenIcon/TokenIcon'
import {useState} from "react"
import {toDisplay} from "@/utils/price";

export interface TokenBalance {
    name: string,
    symbol: string,
    decimal: number,
    type_id: string,
    amount: string,
    type: string
}

export default function ListToken({data, status, previewSize = 5}: { data: TokenBalance[], status: string, previewSize?: number }) {
    const [compact, setCompact] = useState(true)

    let list = data
    if (compact) {
        list = data.slice(0, previewSize)
    }

    return <div className="shadow rounded-lg bg-white py-4">
        <div className="flex justify-between flex-row items-center px-4 mb-3">
            <div className="text-xl font-semibold">Token</div>
            <div className="text-xl">--</div>
        </div>
        <div className="flex flex-col">

            { status === 'loading' &&
                <div className="mx-4 my-2">
                    <div className="loading-bg rounded-lg h-[30px] my-2" />
                    <div className="loading-bg rounded-lg h-[30px] my-2" />
                    <div className="loading-bg rounded-lg h-[30px] my-2" />
                </div>
            }

            {
                data.length === 0 && status === 'complete' &&
                <div
                    className="mx-4 h-[120px] flex flex-row justify-center items-center bg-gray-100 text-gray-300 rounded-xl">
                    No assets found
                </div>
            }

            {data.length !== 0 &&
                <div className="flex flex-row flex-nowrap px-4 py-3 text-xs">
                    <div className="shrink-0 basis-1/4">Asset</div>
                    <div className="shrink-0 basis-1/4">Balance</div>
                    <div className="shrink-0 basis-1/4">Price</div>
                    <div className="shrink-0 basis-1/4 text-right">Value</div>
                </div>
            }

            {
                list.map((item, index) => {
                    return <div key={index} className="flex flex-row flex-nowrap px-4 py-3 text-xs hover:bg-gray-100">
                        <div className="shrink-0 basis-1/4 flex-row flex items-center">
                            <TokenIcon symbol={item.symbol} size={18} chain={'ckb'}/>{item.symbol}
                        </div>
                        <div className="shrink-0 basis-1/4">{toDisplay(item.amount, item.decimal, true)}</div>
                        <div className="shrink-0 basis-1/4">--</div>
                        <div className="shrink-0 basis-1/4 text-right">--</div>
                    </div>
                })
            }
        </div>

        { compact && data.length > previewSize &&
            <div
                onClick={() => setCompact(!compact)}
                className="cursor-pointer hover:bg-gray-300 bg-gray-200 h-[40px] rounded-lg flex flex-row items-center justify-center mx-4 mt-2 text-xs">
                {`View All (${data.length})`}
            </div>
        }
    </div>
}
