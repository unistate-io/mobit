import {useEffect, useMemo, useState, useContext} from "react"
import Select from "@/components/Select/Select"
import BigNumber from "bignumber.js"
import {toDisplay} from "@/utils/number_display"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import {MarketContext} from "@/providers/MarketProvider/MarketProvider"
import {TokenBalance} from "@/components/ListToken/ListToken"

export default function NetWorth(props: {balances: TokenBalance[]}) {
    const {lang} = useContext(LangContext)
    const {prices, rates, currCurrency: currency, setCurrCurrency, status, currencySymbol} = useContext(MarketContext)

    const value = useMemo(() => {
        const total = props.balances.reduce((acc, cur) => {
            const amount = BigNumber(cur.amount).div(10 ** cur.decimal)
            return acc.plus(amount.times(prices[cur.symbol] || 0))
        }, BigNumber(0))

        return currency === "usd"
            ? toDisplay(total.toString(), 0, true, 2)
            : toDisplay(total.times(rates.CNY).toString(), 0, true, 2)
    }, [props.balances, currency, rates, prices])

    return (
        <div className="min-w-[190px] shadow bg-white p-4 rounded-lg">
            <div className="text-xs mb-2 flex flex-row items-center justify-between">
                <div>{lang["Net Worth"]}</div>
                <div className="w-[40px]">
                    <Select
                        icon={
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M4.38573 5.53233C4.18573 5.77481 3.81426 5.77481 3.61427 5.53233L0.344665 1.56814C0.0756859 1.24202 0.307659 0.75 0.730393 0.75L7.26961 0.750001C7.69234 0.750001 7.92431 1.24202 7.65533 1.56814L4.38573 5.53233Z"
                                    fill="#272928"
                                />
                            </svg>
                        }
                        defaultValue={"usd"}
                        options={[
                            {id: "usd", label: `USD`},
                            {id: "cny", label: `CNY`}
                        ]}
                        onValueChange={(value: any) => {
                            setCurrCurrency(value)
                        }}
                    />
                </div>
            </div>
            {status !== "loading" ? (
                <div className="text-lg sm:text-2xl font-semibold">
                    {currencySymbol}
                    {value}
                </div>
            ) : (
                <div className="loading-bg h-[32px] rounded-lg" />
            )}
        </div>
    )
}
