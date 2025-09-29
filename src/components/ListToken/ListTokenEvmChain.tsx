import TokenIcon from "../TokenIcon/TokenIcon"
import {useContext, useMemo, useState} from "react"
import {toDisplay} from "@/utils/number_display"
import {TokenInfoWithAddress} from "@/utils/graphql/types"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import {MarketContext} from "@/providers/MarketProvider/MarketProvider"
import BigNumber from "bignumber.js"
import {InternalTokenBalance} from "@/serves/useInternalAssets"
import {useNavigate} from "react-router-dom"
import DialogEvmTokenTransfer from "@/components/Dialogs/DialogEvmTokenTransfer/DialogEvmTokenTransfer"
import DialogEvmTransfer from "@/components/Dialogs/DialogEvmTransfer/DialogEvmTransfer"
import {TooltipItem} from "@/components/Tooltip"
import useEvmNetwork from "@/serves/useEvmNetwork"
export interface TokenBalance extends TokenInfoWithAddress {
    amount: string
    type: string
    chain: "ckb" | "btc" | 'evm'
}

export default function ListTokenEvmChain({
    data,
    status,
    addresses,
}: {
    data: Array<TokenBalance | InternalTokenBalance>
    status: string
    addresses?: string[]
}) {
    // 使用对象来存储每个链的折叠状态
    const [compactStates, setCompactStates] = useState<Record<string, boolean>>({})
    const {lang} = useContext(LangContext)
    const {prices, currCurrency, rates, currencySymbol} = useContext(MarketContext)
    const navigate = useNavigate()
    const SupportedEvmChainMetadata = useEvmNetwork()
    
    // 初始化每个链的折叠状态为 true
    useMemo(() => {
        const initialStates: Record<string, boolean> = {}
        SupportedEvmChainMetadata.forEach(chain => {
            initialStates[chain.chain] = true
        })
        initialStates['other'] = true
        setCompactStates(initialStates)
    }, [])

    // 按链对数据进行分类，并区分 displayData 和 hiddenData
    const groupedData = useMemo(() => {
        const result: Record<string, {
            displayData: Array<TokenBalance | InternalTokenBalance>,
            hiddenData: Array<TokenBalance | InternalTokenBalance>
        }> = {}
        
        // 初始化所有支持的链
        SupportedEvmChainMetadata.forEach(chain => {
            result[chain.chain] = {
                displayData: [],
                hiddenData: []
            }
        })
        
        // 添加一个"其他"类别，用于不属于任何已知链的数据
        result['other'] = {
            displayData: [],
            hiddenData: []
        }

        const checkIfHidden = (item: TokenBalance | InternalTokenBalance) => {
            return (!(item as InternalTokenBalance).usd_price || (item as InternalTokenBalance).usd_price === 0) 
            && !!(item as InternalTokenBalance).contract_address
        }
        
        // 对数据进行分类
        data.forEach(item => {
            if (item.chain === 'evm') {
                let chain = (item as InternalTokenBalance).assets_chain
                
                // 处理 matic-mainnet 到 polygon-mainnet 的转换
                if (chain === 'matic-mainnet') {
                    chain = 'polygon-mainnet'
                }
    
                if (chain && SupportedEvmChainMetadata.some(c => c.chain === chain)) {
                    // 根据 symbol 判断是否为 UNKNOWN ASSET
                    if (checkIfHidden(item)) {
                        result[chain].hiddenData.push(item)
                    } else {
                        result[chain].displayData.push(item)
                    }
                } else {
                    if (checkIfHidden(item)) {
                        result['other'].hiddenData.push(item)
                    } else {
                        result['other'].displayData.push(item)
                    }
                }
            } else {
                if (checkIfHidden(item)) {
                    result['other'].hiddenData.push(item)
                } else {
                    result['other'].displayData.push(item)
                }
            }
        })
        
        return result
    }, [data])

    // 获取所有非空的链类别
    const activeChains = useMemo(() => {
        return Object.entries(groupedData)
            .filter(([_, items]) => items.displayData.length > 0 || items.hiddenData.length > 0)
            .map(([chain]) => chain)
    }, [groupedData])

    // 切换特定链的折叠状态
    const toggleCompact = (chainId: string) => {
        setCompactStates(prev => ({
            ...prev,
            [chainId]: !prev[chainId]
        }))
    }

    const getLink = (token: TokenBalance | InternalTokenBalance) => {
        if (token.chain === 'evm') {
            const contract = (token as InternalTokenBalance).contract_address
            let network = (token as InternalTokenBalance).assets_chain
            if (network === 'matic-mainnet') {
                network = 'polygon-mainnet'
            }
            return contract ? `/evm/token/${network}/${contract}` : `/evm/token/${network}`
        } else {
            return ''
        }
    }

    const calculateValue = (token: TokenBalance) => {
        return (
            currencySymbol +
            toDisplay(
                BigNumber(toDisplay(token.amount, token.decimal!))
                    .times(prices[token.symbol.toUpperCase()].toString())
                    .times(rates[currCurrency.toUpperCase()])
                    .toString(),
                0,
                true,
                2
            )
        )
    }

    const calculatePrice = (token: TokenBalance) => {
        let value = toDisplay(
            BigNumber("1")
                .times(prices[token.symbol.toUpperCase()].toString())
                .times(rates[currCurrency.toUpperCase()])
                .toString(),
            0,
            true,
            4
        )
    
        if (value === "0") {
            return `${lang["LessThan"]} ${currencySymbol}0.0001`
        } else {
            return currencySymbol + value
        }
    }

    // 获取链的显示名称
    const getChainDisplayName = (chainId: string) => {
        const chain = SupportedEvmChainMetadata.find(c => c.chain === chainId)
        return chain ? chain.name : chainId
    }

    // 渲染代币列表项
    const renderTokenItem = (item: TokenBalance | InternalTokenBalance, index: number) => {
        return (
            <div
                onClick={() => {
                    const link = getLink(item)
                    !!link && navigate(link)
                }}
                key={index}
                className={`whitespace-nowrap grid ${
                    !!addresses ? "sm:grid-cols-5 grid-cols-3" : "sm:grid-cols-4 grid-cols-2"
                } ${getLink(item) ? 'cursor-pointer' : '!cursor-default'} px-2 md:px-4 py-3 text-xs box-border hover:bg-gray-100`}
            >
                <div className="shrink-0 basis-1/3 md:basis-1/4 flex-row flex items-center"
                     title={item.symbol!}
                >
                    <TokenIcon
                        symbol={item.symbol!}
                        size={24}
                        chain={(item as InternalTokenBalance).assets_chain || item.chain}
                        url={(item as InternalTokenBalance).assets_icon}
                    />
                    <div className={'max-w-[80px] overflow-hidden whitespace-nowrap overflow-ellipsis'}>{item.symbol!}</div>
                </div>
                <>
                    <div className="flex-row hidden items-center sm:flex">
                        {prices[item.symbol.toUpperCase()] ? calculatePrice(item) : "--"}
                    </div>
                    <div
                        className={`flex items-center ${
                            !!addresses ? "justify-start" : "justify-end sm:justify-start"
                        }`}
                    >
                        {toDisplay(item.amount, item.decimal!, true, 8)}
                    </div>
                    <div
                        className={`flex-row hidden items-center sm:flex ${
                            !!addresses ? "justify-start" : "justify-end"
                        }`}
                    >
                        {prices[item.symbol.toUpperCase()] ? calculateValue(item) : "--"}
                    </div>
                    {!!addresses && addresses.length && (
                        <div
                            onClick={e => {
                                e.stopPropagation()
                                e.preventDefault()
                            }}
                            className="text-right flex-row items-center flex flex-nowrap justify-end"
                        >
                            {item.chain === "evm" && !!(item as InternalTokenBalance).contract_address && (
                                <DialogEvmTokenTransfer 
                                    metadata={{
                                        name: item.name,
                                        symbol: item.symbol,
                                        decimals: (item as InternalTokenBalance).decimal!,
                                        logo: (item as InternalTokenBalance).assets_icon || null,
                                    }}
                                    network={(item as InternalTokenBalance).assets_chain!} 
                                    tokenContract={(item as InternalTokenBalance).contract_address!}>
                                    <TooltipItem tip={lang["Send tokens to others"]}>
                                        <div className="cursor-pointer whitespace-nowrap px-3 md:px-4 py-2 font-semibold text-xs bg-neutral-100 hover:bg-neutral-200 rounded-md shadow-sm justify-center items-center inline-flex">
                                            {lang["Send"]}
                                        </div>
                                    </TooltipItem>
                                </DialogEvmTokenTransfer>
                            )}

                            {item.chain === "evm" && !(item as InternalTokenBalance).contract_address && (
                                <DialogEvmTransfer 
                                    network={(item as InternalTokenBalance).assets_chain!}>
                                    <TooltipItem tip={lang["Send tokens to others"]}>
                                        <div className="cursor-pointer whitespace-nowrap px-3 md:px-4 py-2 font-semibold text-xs bg-neutral-100 hover:bg-neutral-200 rounded-md shadow-sm justify-center items-center inline-flex">
                                            {lang["Send"]}
                                        </div>
                                    </TooltipItem>
                                </DialogEvmTransfer>
                            )}
                        </div>
                    )}
                </>
            </div>
        )
    }

    return (
        <div className=" bg-white">
            <div className="flex flex-col">
                {status === "loading" && (
                    <div className="mx-4 my-2">
                        <div className="loading-bg rounded-lg h-[30px] my-2" />
                        <div className="loading-bg rounded-lg h-[30px] my-2" />
                        <div className="loading-bg rounded-lg h-[30px] my-2" />
                    </div>
                )}

                {data.length === 0 && status !== "loading" && (
                    <div className="mx-4 h-[120px] flex flex-row justify-center items-center bg-gray-100 text-gray-300 rounded-xl">
                        No assets found
                    </div>
                )}

                {data.length !== 0 && status !== "loading" && (
                    <>
                        {activeChains.map(chainId => {
                            const chainData = groupedData[chainId]
                            const hasHiddenData = chainData.hiddenData.length > 0
                            const isCompact = compactStates[chainId]
                            
                            return (
                                <div key={chainId} className="mb-4">
                                    <div className="px-2 md:px-4 py-2 font-semibold text-sm border-b">
                                        {getChainDisplayName(chainId)}
                                    </div>
                                    
                                    <div
                                        className={`grid ${
                                            !!addresses ? "sm:grid-cols-5 grid-cols-3" : "sm:grid-cols-4 grid-cols-2"
                                        } px-2 md:px-4 py-3 text-xs box-border`}
                                    >
                                        <div>{lang["Assets"]}</div>
                                        <div className="hidden sm:block">{lang["Price"]}</div>
                                        <div className={`${!!addresses ? "text-left" : "sm:text-left text-right"}`}>
                                            {lang["Balance"]}
                                        </div>
                                        <div className={`hidden sm:block${!!addresses ? "" : " text-right"}`}>{lang["Value"]}</div>
                                        {!!addresses && <div className="text-right">{lang["Actions"]}</div>}
                                    </div>
                                    
                                    {/* 显示 displayData */}
                                    {chainData.displayData.map((item, index) => renderTokenItem(item, index))}
                                    
                                    {/* 根据折叠状态显示 hiddenData */}
                                    {!isCompact && hasHiddenData && chainData.hiddenData.map((item, index) => renderTokenItem(item, index))}
                                    
                                    {/* 折叠/展开按钮 */}
                                    {hasHiddenData && (
                                        <div
                                            onClick={() => toggleCompact(chainId)}
                                            className="cursor-pointer hover:bg-gray-300 bg-gray-200 h-[40px] rounded-lg flex flex-row items-center justify-center mx-4 mt-2 text-xs"
                                        >
                                            {isCompact 
                                                ? `${lang["ViewAll"]} (${chainData.displayData.length + chainData.hiddenData.length})` 
                                                : `${lang["ViewLess"]}`}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </>
                )}
            </div>
        </div>
    )
}
