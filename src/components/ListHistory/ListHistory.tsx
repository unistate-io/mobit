import {Link} from "react-router-dom"
import {shortTransactionHash} from "@/utils/number_display"
import * as dayjsLib from "dayjs"
import TokenIcon from "@/components/TokenIcon/TokenIcon";

const dayjs: any = dayjsLib
const relativeTime = require('dayjs/plugin/relativeTime')
dayjsLib.extend(relativeTime)

export default function ListHistory({data, status}: { data: TransactionHistory[], status: string }) {

    return <div className="shadow rounded-lg bg-white py-4">
        <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
            <div className="text-xl font-semibold">Activity</div>
        </div>
        <div className="flex flex-col px-3">
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

            {
                data.map((item, index) => {
                    return <Link
                        target="blank"
                        to={`https://explorer.nervos.org/transaction/${item.attributes.transaction_hash}`} key={item.id}
                        className="bg-stone-50 rounded p-4 mt-3">
                        <div className="flex  flex-row text-xs">
                            <div
                                className="text-[#6CD7B2] mr-2">{shortTransactionHash(item.attributes.transaction_hash)}</div>
                            <div className="text-neutral-500">{dayjs(item.attributes.created_at).fromNow()}</div>
                        </div>
                        {
                            calculateTotalAmount(item).map((res) => {
                                const color = res.delta.includes('+') ?
                                    'text-green-500'
                                    : res.delta.includes('-') ?
                                        'text-red-500' :
                                        'text-neutral-500'
                                return <div key={res.symbol} className="flex flex-row justify-between mt-1 text-xs">
                                    <div className="flex-row flex items-center">
                                        <TokenIcon symbol={res.symbol} size={18}/>
                                        {res.symbol}
                                    </div>
                                    <div className={color}>{res.delta}</div>
                                </div>
                            })
                        }
                    </Link>
                })
            }
        </div>
    </div>
}

function calculateTotalAmount(data: TransactionHistory) {
    const address = data.attributes.display_inputs[0].address_hash
    const inputs = data.attributes.display_inputs.filter((input) => input.address_hash === address)
    const outputs = data.attributes.display_outputs.filter((output) => output.address_hash === address)

    let tokens: { symbol: string, decimal: string }[] = []
    inputs.forEach((input) => {
        if (input.xudt_info && !tokens.some((token) => token.symbol === input.xudt_info!.symbol)) {
            tokens.push({
                symbol: input.xudt_info!.symbol,
                decimal: input.xudt_info!.decimal
            })
        }
    })

    const inputCkbAmount = inputs.reduce((acc, input) => {
        if (!input.xudt_info) {
            return acc + Number(input.capacity)
        } else {
            return acc
        }
    }, 0)

    const outputCkbAmount = outputs.reduce((acc, output) => {
        if (!output.xudt_info) {
            return acc + Number(output.capacity)
        } else {
            return acc
        }
    }, 0)

    const ckbDelta = (outputCkbAmount - inputCkbAmount) / 10 ** 8
    let res = [{
        symbol: 'CKB',
        delta: ckbDelta > 0 ? '+' + ckbDelta.toString() : ckbDelta.toString(),
    }] as { symbol: string, delta: string }[]

    tokens.map((token) => {
        const inputAmount = inputs.reduce((acc, input) => {
            if (input.xudt_info && input.xudt_info.symbol === token.symbol) {
                return acc + Number(input.xudt_info.amount)
            } else {
                return acc
            }
        }, 0)

        const outputAmount = outputs.reduce((acc, output) => {
            if (output.xudt_info && output.xudt_info.symbol === token.symbol) {
                return acc + Number(output.xudt_info.amount)
            } else {
                return acc
            }
        }, 0)

        const delta = (outputAmount - inputAmount) / 10 ** Number(token.decimal)

        res.push({
            symbol: token.symbol,
            delta: delta > 0 ? '+' + delta.toString() : delta.toString(),
        })
    })

    return res
}

export interface TransactionHistory {
    id: string,
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
