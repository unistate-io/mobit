import TokenIcon from "@/components/TokenIcon/TokenIcon"
import useMarket from "@/serves/useMarket"
import {toDisplay} from "@/utils/number_display"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import {useContext, useEffect, useState, useMemo} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import HomeActions from "@/components/HomeActions"

export default function MarketPage() {
    const {data, status} = useMarket()
    const {lang} = useContext(LangContext)
    const {open, address} = useContext(CKBContext);
    const [showTable, setShowTable] = useState(false)


    useEffect(() => {
        function checkWindowSize() {
            setShowTable(window.innerWidth > 460)
        }

        window.addEventListener('resize', checkWindowSize)
        checkWindowSize()

        return () => {
            window.removeEventListener('resize', checkWindowSize)
        }
    }, []);

    const marketToDisplay = useMemo(() => {
        return data.filter((item) => {
            console.log("item.symbol", item.symbol)
            return item.symbol !== 'MATIC'
        })
    }, [data])

    return <div className="max-w-[--page-with] mx-auto px-3 mt-4 md:mt-10 mb-10">
        <div className="py-9 mb-4 px-4 flex flex-col justify-center items-center shadow rounded-lg overflow-hidden"
             style={{background: 'url("/images/market_image.png") center bottom no-repeat', backgroundSize: '100% 200px'}}>
            <img src="/images/logo.png" className="w-[114px] h-[32px] mb-3" alt=""/>
            <div className="font-semibold text-xl text-center mb-4" dangerouslySetInnerHTML={{__html: lang['Effortlessly and securely transfer assets between Bitcoin and CKB']}}></div>
            <div className="text-[#7B7C7B] text-sm mb-4">{lang['Enjoying a seamless cross-chain experience with RGB++ Leap functionality!']}</div>
            {
                !address && <button
                    className="btn btn-primary py-3 px-6  font-semibold hover:opacity-80 rounded-[100px] bg-[#7FF7CE]"
                    onClick={open}>
                    {lang['Connect Wallet']} <i className="uil-arrow-right"/>
                </button>
            }
        </div>

        <HomeActions />

        {status === 'loading' &&
            <>
                <div className="loading-bg h-[50px] mb-3 rounded-lg"/>
                <div className="loading-bg h-[50px] mb-3 rounded-lg w-[80%]"/>
                <div className="loading-bg h-[50px] mb-3 rounded-lg" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg w-[80%]" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg w-[80%]" />
                <div className="loading-bg h-[50px] mb-3 rounded-lg" />
            </>
        }

        { marketToDisplay.length !== 0 && status !== 'loading' && showTable &&
            <div className="shadow bg-white my-3 p-4 rounded-lg">
                <table className="table w-full">
                    <thead>
                    <tr className="border-b-[1px]">
                        <th className="text-base font-normal pt-2 text-left pb-3">{lang['Tokens']}</th>
                        <th className="text-base font-normal pt-2 text-center px-4 pb-3">{lang['Price']}</th>
                        <th className="text-base font-normal pt-2 text-left pb-3">{lang['MarketCap']}</th>
                        <th className="text-base font-normal pt-2 text-right pb-3">{lang['Change24h']}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {marketToDisplay?.map((item, index) => {
                        return <tr key={index}>
                            <td className="py-4 text-lg">
                                <div className="flex flex-row items-center">
                                    <TokenIcon symbol={item.symbol} size={20}/>
                                    <div className="text-xl font-semibold">{item.symbol}</div>
                                </div>
                            </td>
                            <td className="py-4 text-center px-4 text-lg">${item.price}</td>
                            <td className="py-4 text-lg">{item.market_cap ? '$' + toDisplay(item.market_cap + '', 0, true, 0) : '--'}</td>
                            <td className="py-4 text-right text-lg"><DisPlayChange change={item.change_24h}/></td>
                        </tr>
                    })}
                    </tbody>
                </table>
            </div>
        }

        {marketToDisplay.length !== 0 && status !== 'loading' && !showTable &&
            marketToDisplay?.map((item, index) => {
                return <div className="flex flex-col p-4 shadow rounded-lg bg-white mb-3" key={index}>
                    <div className="flex flex-row items-center mb-5">
                        <TokenIcon symbol={item.symbol} size={20}/>
                        <div className="text-xl font-semibold">{item.symbol}</div>
                    </div>
                    <div className="flex flex-row items-center mb-4">
                        <div className="mr-[30px] min-w-[35%]">
                            <div className="text-sm flex flex-row items-center">{lang['Price']}</div>
                            <div className="text-lg font-semibold flex">${item.price}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm">{lang['MarketCap']}</div>
                            <div className="text-lg font-semibold">{item.market_cap ? '$' + toDisplay(item.market_cap + '', 0, true, 0) : '--'}</div>
                        </div>
                    </div>
                    <div className="flex flex-row items-center">
                        { !!item.change_24h &&
                            <div className="bg-stone-50 rounded p-3 mr-2 flex-1">
                                <div className="text-xs mb-1">{lang['Change24h']}</div>
                                <div className=""><DisPlayChange change={item.change_24h} /></div>
                            </div>
                        }
                    </div>
                </div>

            })
        }
    </div>
}

export function DisPlayChange (props: {change?: number, className?: string}) {
    if (!props.change) {
        return <span className={`${props.className}`}>--</span>
    }
    
    const color = props.change > 0 ? 'text-green-500' : 'text-red-500'
    const text = props.change > 0 ? `+${(props.change).toFixed(2)}%` : `${(props.change).toFixed(2)}%`

    return <span className={`${color} ${props.className}`}>{text}</span>
}
