import TokenIcon from "@/components/TokenIcon/TokenIcon"
import useMarket from "@/serves/useMarket";
import {toDisplay} from "@/utils/number_display";

export default function MarketPage() {
    const {data, status} = useMarket()

    return <div className="max-w-[624px] mx-auto px-3 mt-4 md:mt-10">
        { status=== 'loading' &&
            <>
                <div className="loading-bg h-[50px] mb-3 rounded-lg" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg w-[80%]" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg w-[80%]" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg w-[80%]" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg" />
            </>
        }

        { data.length !== 0 && status !== 'loading' &&
            data?.map((item, index) => {
                return <div className="flex flex-col p-4 shadow rounded-lg bg-white mb-3" key={index}>
                    <div className="flex flex-row items-center mb-5">
                        <TokenIcon symbol={item.symbol} size={20} />
                        <div className="text-xl font-semibold">{item.symbol}</div>
                    </div>
                    <div className="flex flex-row items-center mb-4">
                        <div className="mr-[44px]">
                            <div className="text-sm">Price</div>
                            <div className="text-lg font-semibold">${item.price}</div>
                        </div>

                        <div>
                            <div className="text-sm">Market Cap</div>
                            <div className="text-lg font-semibold">${toDisplay(item.market_cap + '', 0, true, true)}</div>
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        <div className="bg-stone-50 rounded p-3 mr-2 flex-1">
                            <div className="text-xs mb-1">Change 1h</div>
                            <div className=""><DisPlayChange change={item.change_1h} /></div>
                        </div>
                        <div className="bg-stone-50 rounded p-3 mr-2 flex-1">
                            <div className="text-xs mb-1">Change 24h</div>
                            <div className=""><DisPlayChange change={item.change_24h} /></div>
                        </div>
                        <div className="bg-stone-50 rounded p-3 mr-2 flex-1">
                            <div className="text-xs mb-1">Change 7d</div>
                            <div className=""><DisPlayChange change={item.change_7d} /></div>
                        </div>
                    </div>
                </div>

            })
        }
    </div>
}

export function DisPlayChange (props: {change: number, className?: string}) {
    const color = props.change > 0 ? 'text-green-500' : 'text-red-500'
    const text = props.change > 0 ? `+${(props.change).toFixed(2)}%` : `${(props.change).toFixed(2)}%`

    return <span className={`${color} ${props.className}`}>{text}</span>
}
