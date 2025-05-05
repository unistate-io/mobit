import TokenIcon from "../TokenIcon/TokenIcon"
import {useContext, useMemo, useState} from "react"
import {toDisplay} from "@/utils/number_display"
import {TokenInfoWithAddress} from "@/utils/graphql/types"
import DialogBtcXudtTransfer from "@/components/Dialogs/DialogBtcXudtTransfer/DialogBtcXudtTransfer"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import DialogLeapXudtToLayer2 from "@/components/Dialogs/DialogLeapXudtToLayer2/DialogLeapXudtToLayer2"
import useBtcWallet from "@/serves/useBtcWallet"
import {TooltipItem} from "@/components/Tooltip"
import {MarketContext} from "@/providers/MarketProvider/MarketProvider"
import BigNumber from "bignumber.js"
import {InternalTokenBalance} from "@/serves/useInternalAssets"
import {useNavigate} from "react-router-dom"

export interface TokenBalance extends TokenInfoWithAddress {
    amount: string
    type: string
    chain: "ckb" | "btc" | "evm"
}

export default function ListTokenBtcChain({
    data,
    status,
    addresses
}: {
    data: Array<TokenBalance | InternalTokenBalance>
    status: string
    addresses?: string[]
}) {
    const [compact, setCompact] = useState(true)
    const {lang} = useContext(LangContext)
    const {isBtcWallet} = useBtcWallet()
    const {prices, currCurrency, rates, currencySymbol} = useContext(MarketContext)
    const navigate = useNavigate()

    const displayData = useMemo(() => {
        return data.filter(item => item.symbol !== "UNKNOWN ASSET")
    }, [data])

    const hiddenData = useMemo(() => {
        return data.filter(item => item.symbol === "UNKNOWN ASSET")
    }, [data])

    const list = useMemo(() => {
        if (compact) {
            return displayData
        } else {
            return [...displayData, ...hiddenData]
        }
    }, [displayData, hiddenData, compact])

    const getLink = (token: TokenBalance | InternalTokenBalance) => {
        if (token.symbol === "BTC") {
            return "/bitcoin"
        } else if (token.chain === "btc") {
            return `/bitcoin/token/${token.type_address_id}`
        } else return ""
    }

    const calculateValue = (token: TokenBalance) => {
        return (
            currencySymbol +
            toDisplay(
                BigNumber(toDisplay(token.amount, token.decimal!))
                    .times(prices[token.symbol].toString())
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
            BigNumber("1").times(prices[token.symbol].toString()).times(rates[currCurrency.toUpperCase()]).toString(),
            0,
            true,
            4
        )
        return currencySymbol + value
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
                )}

                {status !== "loading" &&
                    list.map((item, index) => {
                        return (
                            <div
                                onClick={() => {
                                    const link = getLink(item)
                                    !!link && navigate(link)
                                }}
                                key={index}
                                className={`whitespace-nowrap grid ${
                                    !!addresses ? "sm:grid-cols-5 grid-cols-3" : "sm:grid-cols-4 grid-cols-2"
                                } ${getLink(item) ? "cursor-pointer" : "!cursor-default"} px-2 md:px-4 py-3 text-xs box-border hover:bg-gray-100`}
                            >
                                <div
                                    className="shrink-0 basis-1/3 md:basis-1/4 flex-row flex items-center"
                                    title={item.symbol!}
                                >
                                    <TokenIcon
                                        symbol={item.symbol!}
                                        size={24}
                                        chain={(item as InternalTokenBalance).assets_chain || item.chain}
                                        url={(item as InternalTokenBalance).assets_icon}
                                    />
                                    <div className={"max-w-[80px] overflow-hidden whitespace-nowrap overflow-ellipsis"}>
                                        {item.symbol!}
                                    </div>
                                </div>
                                <>
                                    <div className="flex-row hidden items-center sm:flex">
                                        {prices[item.symbol] ? calculatePrice(item) : "--"}
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
                                        {prices[item.symbol] ? calculateValue(item) : "--"}
                                    </div>
                                    {!!addresses && addresses.length && (
                                        <div
                                            onClick={e => {
                                                e.stopPropagation()
                                                e.preventDefault()
                                            }}
                                            className="text-right flex-row items-center flex flex-nowrap justify-end"
                                        >
                                            {item.chain === "btc" && item.symbol !== "BTC" && isBtcWallet && (
                                                <>
                                                    <DialogLeapXudtToLayer2 token={item}>
                                                        <TooltipItem tip={lang["Leap tokens to CKB chain"]}>
                                                            <div className="cursor-pointer whitespace-nowrap px-3 md:px-4 py-2 font-semibold text-xs bg-neutral-100 hover:bg-neutral-200 rounded-md shadow-sm justify-center items-center inline-flex md:mr-2 mr-1">
                                                                {lang["Leap"]}
                                                            </div>
                                                        </TooltipItem>
                                                    </DialogLeapXudtToLayer2>
                                                    <DialogBtcXudtTransfer token={item}>
                                                        <TooltipItem tip={lang["Send tokens to others"]}>
                                                            <div className="cursor-pointer whitespace-nowrap px-3 md:px-4 py-2 font-semibold text-xs bg-neutral-100 hover:bg-neutral-200 rounded-md shadow-sm justify-center items-center inline-flex">
                                                                {lang["Send"]}
                                                            </div>
                                                        </TooltipItem>
                                                    </DialogBtcXudtTransfer>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>
                            </div>
                        )
                    })}
            </div>

            {hiddenData.length > 0 && (
                <div
                    onClick={() => setCompact(!compact)}
                    className="cursor-pointer hover:bg-gray-300 bg-gray-200 h-[40px] rounded-lg flex flex-row items-center justify-center mx-4 mt-2 text-xs"
                >
                    {compact ? `${lang["ViewAll"]} (${data.length})` : `${lang["ViewLess"]}`}
                </div>
            )}
        </div>
    )
}
