import { useContext, useEffect, useRef, useState } from "react"
import { type TokenMetadataResponse } from 'alchemy-sdk';
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import { CKBContext } from "@/providers/CKBProvider/CKBProvider"
import Button from "@/components/Form/Button/Button"
import { getInternalAddressChain, shortTransactionHash } from "@/utils/common"
import { LangContext } from "@/providers/LangProvider/LangProvider"
import ProfileAddresses from "@/components/ProfileAddresses/ProfileAddresses"
import { toDisplay } from "@/utils/number_display"
import DialogXudtReceive from "@/components/Dialogs/DialogXudtReceive/DialogXudtReceive"
import { AreaSeries, createChart, ColorType } from 'lightweight-charts';
import dayjs from "dayjs"
import { ChainIcons } from "@/components/TokenIcon/icons"
import CopyText from "@/components/CopyText/CopyText"
import ListEvmTokenHistory from "@/components/ListEvmTokenHistory"
import { useParams } from "react-router-dom"
import DialogEvmTokenTransfer from "@/components/Dialogs/DialogEvmTokenTransfer/DialogEvmTokenTransfer"
import useEvmTokenTransfer from "@/serves/useEvmTokenTransfer";

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

export interface EvmTokenPropsSearchParams {
    contract?: string
    network?: string,
    [index: string]: string | undefined
}

export default function EvmTokenPage() {
    const {network, contract} = useParams<EvmTokenPropsSearchParams>()
    const { internalAddress, wallet, signer } = useContext(CKBContext)
    const { lang } = useContext(LangContext)
    const {allowedTransfer} = useEvmTokenTransfer()

    const chartBoxRef = useRef<HTMLDivElement>(null)

    const [metadata, setMetadata] = useState<TokenMetadataResponse | null>(null)
    const [balance, setBalance] = useState<string | null>(null)
    const [chartData, setChartData] = useState<any>(null)
    const [transactions, setTransactions] = useState<EvmTokenTransaction[]>([])


    const [loadingMetadata, setLoadingMetadata] = useState(true)
    const [loadingTransactions, setLoadingTransactions] = useState(false)
    const [loadingBalance, setLoadingBalance] = useState(true)

    const getTokenMetadata = async () => {
        setLoadingMetadata(true)
        try {
            const res = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contract,
                    network
                })
            })

            if (!res.ok) {
                console.error('Failed to fetch token metadata', res.statusText)
            }

            const data = await res.json()
            setMetadata(data.metadata)
            setChartData(data.price_history)
        } catch (error) {
            console.error('Error fetching token metadata', error)
        } finally {
            setLoadingMetadata(false)
        }
    }
    
    const getTokenTransactions = async () => {
        if (!internalAddress || !metadata) {
            return
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/transactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contract,
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

    const getBalance = async () => {
        if (!internalAddress || !metadata) {
            return
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/token_balance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token_address: contract,
                    network,
                    address: internalAddress
                })
            })

            if (!res.ok) {
                console.error('Failed to fetch token balance', res.statusText)
            }

            const data = await res.json()
            console.log('data.balance', data)
            setBalance(data.balance)
            
        } catch (error) {
            console.error('Error fetching token balance', error)
        } finally {
            setLoadingBalance(false)
        }
    }

    useEffect(() => {
        getTokenMetadata()
    }, [contract, network])

    useEffect(() => {
        console.log('wallet ==>', wallet, signer)
        getTokenTransactions()
        getBalance()
    }, [internalAddress, metadata])

    useEffect(() => {
        if (!chartBoxRef.current || !chartData) return

        const handleResize = () => {
           !!chartBoxRef.current && chart.applyOptions({ width: chartBoxRef.current!.clientWidth });
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
                    symbol={metadata?.symbol || ''}
                    url={metadata?.logo || undefined}
                    size={90} />
            </div>
            {loadingMetadata ?
                <div className={'loading-bg h-[30px] mb-3 rounded-lg'} />
                : <div className="text-lg mb-4">
                    <div className="font-semibold mr-3 text-2xl"> {metadata?.symbol || "Inscription"}</div>
                    <div className="text-sm"> {metadata?.name}</div>
                </div>
            }


            {getInternalAddressChain(internalAddress) === 'evm' && !!metadata && !loadingBalance &&
                <>
                    <div className={'justify-between mb-3'}>
                        <div className="mb-2">{lang['Balance']}</div>
                        {loadingBalance ?
                            <div className={'loading-bg h-[30px] mb-3 rounded-lg mt-3'} /> :
                            <div>
                                <ProfileAddresses addresses={[internalAddress!]} defaultAddress={internalAddress!} />
                                <div className="font-semibold">
                                    {toDisplay(balance || '0', metadata!.decimals!, true)} {metadata!.symbol}
                                </div>
                            </div>
                        }
                    </div>
                    <div className="flex flex-row justify-between text-sm">
                        {allowedTransfer && <DialogEvmTokenTransfer 
                        className="mr-2"
                        network={network!} 
                        metadata={metadata!}
                        tokenContract={contract!}
                        >
                        <div 
                        className="bg-gray-200 hover:bg-gray-300 data-[loading=true]:pointer-events-none data-[loading=true]:opacity-50 disabled:opacity-50 font-semibold w-full px-4 py-3 rounded-lg flex flex-row flex-nowrap items-center justify-center">
                            {lang["Send"]}
                            </div>
                        </DialogEvmTokenTransfer>}
                        <DialogXudtReceive address={internalAddress!} className="flex-1">
                            <Button className="text-white !bg-[#000] hover:opacity-80 hover:bg-[#000]"
                            >{lang['Receive']}</Button>
                        </DialogXudtReceive>
                    </div>
                </>
            }
        </div>

        <div className="shadow flex-1 w-full mt-6 sm:mt-0 sm:ml-6 rounded-lg px-5 py-3">
            {loadingMetadata && <div className={'w-full h-[350px] loading-bg rounded-lg'}></div>}
            {!!chartData && chartData.length === 0 &&
                <div
                    className="h-[350px] flex items-center justify-center flex-row w-full bg-gray-50 rounded text-gray-300">
                    No Data
                </div>
            }
            {!!chartData?.length && <div className={'w-full relative'} ref={chartBoxRef} />}

            <div className="font-semibold text-lg mb-4 mt-12">{lang['Token Info']}</div>
            <div className="flex flex-row justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-2 justify-center flex-1 items-center p-4 shadow rounded-lg bg-white">
                    <div className="flex items-center gap-2">
                        {!!ChainIcons[network!] && <img src={ChainIcons[network!]} alt="chain" className="w-4 h-4" />}
                        {network!.split('-')[0].toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-500">Chain</div>
                </div>
                <div className="flex flex-col gap-2 justify-center flex-1 items-center  p-4 shadow rounded-lg  bg-white">
                    <div className="flex items-center gap-2">
                        <CopyText copyText={contract!}>
                            {shortTransactionHash(contract!)}
                        </CopyText>
                    </div>
                    <div className="text-sm text-gray-500">Contract</div>
                </div>
                <div className="flex flex-col gap-2 justify-center flex-1 items-center  p-4 shadow rounded-lg  bg-white">
                    <div>erc20</div>
                    <div className="text-sm text-gray-500">Type</div>
                </div>
            </div>


            <div className="font-semibold text-lg mb-3 mt-12">{lang['Transactions']}</div>
            <ListEvmTokenHistory 
                data={transactions} 
                address={internalAddress}
                status={loadingTransactions ? 'loading' : 'complete'} network={network!} />
        </div>
    </div>

}