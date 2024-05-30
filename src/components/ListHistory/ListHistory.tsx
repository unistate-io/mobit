import {Link} from "react-router-dom"
import {shortTransactionHash} from "@/utils/number_display"
import * as dayjsLib from "dayjs"

const dayjs: any = dayjsLib
const relativeTime = require('dayjs/plugin/relativeTime')
dayjsLib.extend(relativeTime)

export default function ListHistory({data, status}: {data: TransactionHistory[], status: string}) {

    return <div className="shadow rounded-lg bg-white py-4">
        <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
            <div className="text-xl font-semibold">Activity</div>
        </div>
        <div className="flex flex-col px-3">
            { status === 'loading' &&
                <div className="mx-4 my-2">
                    <div className="loading-bg rounded-lg h-[30px] my-2" />
                    <div className="loading-bg rounded-lg h-[30px] my-2" />
                    <div className="loading-bg rounded-lg h-[30px] my-2" />
                </div>
            }

            {
                data.length === 0 && status !== 'loading' &&
                <div
                    className="mx-4 h-[120px] flex flex-row justify-center items-center bg-gray-100 text-gray-300 rounded-xl">
                    No assets found
                </div>
            }

            {
                data.map((item, index) => {
                    return <Link
                        target="blank"
                        to={`https://explorer.nervos.org/transaction/${item.attributes.transaction_hash}`} key={item.id} className="bg-stone-50 rounded p-4 mt-3">
                        <div className="flex justify-between flex-row text-xs">
                            <div>{shortTransactionHash(item.attributes.transaction_hash)}</div>
                            <div>{dayjs(item.attributes.created_at).fromNow()}</div>
                        </div>
                    </Link>
                })
            }
        </div>
    </div>
}

export interface TransactionHistory {
    id:string,
    type: string,
    attributes: {
        block_number: string,
        block_timestamp: string,
        created_at: string,
        income: string,
        transaction_hash: string,
        display_outputs: {
            address_hash: string
            capacity: string,
            cell_index: string,
            cell_type: string,
            generated_tx_hash: string,
            id: string,
            occupied_capacity: string
            status: string
            xudt_info?: {
                symbol: string,
                amount: string,
                decimal: string,
                published: boolean,
                type_hash: string,
            }
            extra_info?: {
                amount: string,
                decimal: string,
                display_name: string,
                symbol: string,
            }
        }[],
        display_inputs: {
            address_hash: string
            capacity: string,
            cell_index: string,
            cell_type: string,
            generated_tx_hash: string,
            id: string,
            occupied_capacity: string
            status: string
            xudt_info?: {
                symbol: string,
                amount: string,
                decimal: string,
                published: boolean,
                type_hash: string,
            }
            extra_info?: {
                amount: string,
                decimal: string,
                display_name: string,
                symbol: string,
            }
        }[],
    }
}
