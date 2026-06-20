import {useContext, useEffect, useRef, useState} from "react"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import Button from "@/components/Form/Button/Button"
import {getInternalAddressChain} from "@/utils/common"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import ProfileAddresses from "@/components/ProfileAddresses/ProfileAddresses"
import {toDisplay} from "@/utils/number_display"
import DialogXudtReceive from "@/components/Dialogs/DialogXudtReceive/DialogXudtReceive"
import {AreaSeries, createChart, ColorType} from "lightweight-charts"
import dayjs from "dayjs"
import ListEvmTokenHistory from "@/components/ListEvmTokenHistory"
import {useParams} from "react-router-dom"
import {useNavigate} from "react-router-dom"
import useEvmNetwork from "@/serves/useEvmNetwork"
import useEvmTokenTransfer from "@/serves/useEvmTokenTransfer"
import DialogEvmTransfer from "@/components/Dialogs/DialogEvmTransfer/DialogEvmTransfer"

export interface EvmTokenTransaction {
    blockNum: string
    uniqueId: string
    hash: string
    from: string
    to: string
    value: number
    erc721TokenId: string | null
    erc1155Metadata: string | null
    tokenId: string | null
    asset: string
    category: string
    rawContract: {
        value: string
        address: string
        decimal: string
    }
    metadata: {
        blockTimestamp: string
    }
}

export interface EvmNativeTokenSearchParams {
    network?: string,

    [index: string]: string | undefined
}

export default function EvmNativeTokenPage() {
    const {network} = useParams<EvmNativeTokenSearchParams>()
    const navigate = useNavigate()
    if (!network) {
        navigate("/", {replace: true})
    }
    const {allowedTransfer} = useEvmTokenTransfer()
    const SupportedEvmChainMetadata = useEvmNetwork()
    
    const metadata = SupportedEvmChainMetadata.find(m => m.chain === network)
    if (!metadata) {
        navigate("/", {replace: true})
    }

    const {internalAddress} = useContext(CKBContext)
    const {lang} = useContext(LangContext)

    const chartBoxRef = useRef<HTMLDivElement>(null)

    const [balance, setBalance] = useState<string | null>(null)
    const [chartData, setChartData] = useState<any>(null)
    const [transactions, setTransactions] = useState<EvmTokenTransaction[]>([])


    const [loadingMetadata, setLoadingMetadata] = useState(false)
    const [loadingTransactions, setLoadingTransactions] = useState(false)
    const [loadingBalance, setLoadingBalance] = useState(false)

    const getBalance = async () => {
        if (!internalAddress) return
        setLoadingBalance(true)
        try {
            const res = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/balance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: internalAddress,
                    networks: [network]
                })
            })
            const data = await res.json()
            const target = data[0]
            setBalance(target?.amount || '0')
        } catch (error) {
            console.error("getBalance error", error)
        } finally {
            setLoadingBalance(false)
        }
    }

    const getPriceHistory = async () => {
        if (!metadata) return
        setLoadingMetadata(true)
        try {
            const res = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/token/price_history`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    symbol: metadata?.tokenSymbol,
                })
            })
            const data = await res.json()
            setChartData(data.price_history)
        } catch (error) {
            console.error("getBalance error", error)
        } finally {
            setLoadingMetadata(false)
        }
    }

    const getTransactions = async () => {
        if (!internalAddress || !metadata) {
            return
        }

        setLoadingMetadata(true)
        try {
            const res = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/transactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    network,
                    wallet: internalAddress
                })
            })

            if (!res.ok) {
                console.error('Failed to fetch token transactions', res.statusText)
            }

            const data = await res.json()
            setTransactions(data.transactions)
        } catch (error) {
            console.error('Error fetching token transactions', error)
        } finally {
            setLoadingTransactions(false)
        }
    }

    useEffect(() => {
        if (!!internalAddress) {
            getBalance()
            getTransactions()
        }
        if (metadata) {
            getPriceHistory()
        }
    }, [internalAddress, metadata])


    useEffect(() => {
        if (!chartBoxRef.current || !chartData) return

        const handleResize = () => {
            if (chartBoxRef.current) {
                chart.applyOptions({ width: chartBoxRef.current!.clientWidth });
            }
        };

        const chart = createChart(chartBoxRef.current, {
            width: chartBoxRef.current.clientWidth,
            height: 350,
            layout: {
                textColor: '#333',
                background: {
                    type: ColorType.Solid,
                    color: '#fff',
                }
            },
            grid: {
                vertLines: {
                    color: '#eee',
                    visible: false,
                    style: 4,
                },
                horzLines: {
                    color: '#eee',
                    style: 1,
                    visible: false,
                },
            },
            crosshair: {
                mode: 1,
            },
            timeScale: {
                visible: true,
                borderColor: 'rgba(0,0,0,0)',
            },
            rightPriceScale: {
                visible: true,
                borderColor: 'rgba(0,0,0,0)',
            },
        })

        chart.timeScale().fitContent();

        chart.applyOptions({
            localization: {
                locale: 'en',
            },
        });

        const newSeries = chart.addSeries(AreaSeries, {
            topColor: 'rgba(74,142,249,0.3)',
            bottomColor: 'rgba(74,142,249,0.3)',
            lineColor: 'rgba(74,142,249,1)',
            lineWidth: 2,
            priceFormat: {
                type: 'custom',
                formatter: (price: number) => {
                    const formattedPrice = Number(price.toFixed(2))
                    return formattedPrice < 0 ? '' : `$${formattedPrice}`
                },
            }
        })
        newSeries.setData(chartData.map((d: { timestamp: string, value: string }) => {
            return {
                time: dayjs(d.timestamp).format('YYYY-MM-DD'),
                value: parseFloat(Number(d.value).toFixed(2)),
            }
        }))

        // 创建工具提示元素
        const tooltip = chartBoxRef.current.querySelector('.chart-tooltip') as HTMLDivElement || document.createElement('div')
        tooltip.className = 'chart-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            left: 10px;
            top: 10px;
            font-size: 14px;
            color: #333;
            pointer-events: none;
            z-index: 10;
        `;
        const initData = chartData[chartData.length - 1]
        tooltip.innerHTML = `<div>
                    <div class="text-4xl">$${Number(Number(initData.value).toFixed(2))}</div>
                    <div>${dayjs(initData.timestamp).format('YYYY-MM-DD')}</div>
                </div>`
        chartBoxRef.current?.appendChild(tooltip);

        // 监听鼠标移动事件
        chart.subscribeCrosshairMove((param) => {
            if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
                const data = chartData[chartData.length - 1]
                tooltip.style.display = 'block';
                tooltip.innerHTML = `<div>
                    <div class="text-4xl">$${Number(Number(initData.value).toFixed(2))}</div>
                    <div>${dayjs(data.timestamp).format('YYYY-MM-DD')}</div>
                </div>`
                return
            }

            const data = param.seriesData?.get(newSeries) as { value: string } | undefined
            if (data !== undefined) {
                tooltip.style.display = 'block';
                tooltip.innerHTML = `<div>
                    <div class="text-4xl">$${data.value}</div>
                    <div>${param.time.toString()}</div>
                </div>`;
            }
        });

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [chartData])

    return <div className="max-w-[--page-with] mx-auto px-3 py-8 flex flex-col sm:flex-row items-start mb-10">
        <div
            className="sm:w-[320px] w-full shadow rounded-lg overflow-hidden bg-[url('./assets/token_bg.png')] bg-[length:100%_auto] bg-no-repeat p-5">
            <div className="mt-10 mb-4">
                <TokenIcon
                    symbol={metadata?.tokenSymbol || ""}
                    size={90} />
            </div>
            <div className="text-lg mb-4">
                <div className="font-semibold mr-3 text-2xl"> {metadata?.tokenSymbol || "Inscription"}</div>
                <div className="text-sm"> {metadata?.name}</div>
            </div>


            {getInternalAddressChain(internalAddress) === "evm" && !!metadata && !loadingBalance &&
                <>
                    <div className={"justify-between mb-3"}>
                        <div className="mb-2">{lang["Balance"]}</div>
                        {loadingBalance ?
                            <div className={"loading-bg h-[30px] mb-3 rounded-lg mt-3"} /> :
                            <div>
                                <ProfileAddresses addresses={[internalAddress!]} defaultAddress={internalAddress!} />
                                <div className="font-semibold">
                                    {toDisplay(balance || "0", 18, true)} {metadata!.tokenSymbol}
                                </div>
                            </div>
                        }
                    </div>
                    <div className="flex flex-row justify-between text-sm">
                        {allowedTransfer && <DialogEvmTransfer className="mr-2" network={network!}>
                            <div className="bg-gray-200 hover:bg-gray-300 data-[loading=true]:pointer-events-none data-[loading=true]:opacity-50 disabled:opacity-50 font-semibold w-full px-4 py-3 rounded-lg flex flex-row flex-nowrap items-center justify-center">{lang["Send"]}</div>
                            </DialogEvmTransfer>}
                        <DialogXudtReceive address={internalAddress!} className="flex-1">
                            <Button className="text-white !bg-[#000] hover:opacity-80 hover:bg-[#000]"
                            >{lang["Receive"]}</Button>
                        </DialogXudtReceive>
                    </div>
                </>
            }
        </div>

        <div className="shadow flex-1 w-full mt-6 sm:mt-0 sm:ml-6 rounded-lg px-5 py-3">
            {loadingMetadata && <div className={"w-full h-[350px] loading-bg rounded-lg"}></div>}
            {!!chartData && chartData.length === 0 &&
                <div
                    className="h-[350px] flex items-center justify-center flex-row w-full bg-gray-50 rounded text-gray-300">
                    No Data
                </div>
            }
            {!!chartData?.length && !loadingMetadata && <div className={"w-full relative"} ref={chartBoxRef} />}

            <div className="font-semibold text-lg mb-3 mt-12">{lang["Transactions"]}</div>
            <ListEvmTokenHistory
                data={transactions}
                address={internalAddress}
                status={loadingTransactions ? "loading" : "complete"} network={network!} />
        </div>
    </div>

}