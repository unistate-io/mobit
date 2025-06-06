import {createContext, ReactNode, useCallback, useEffect, useState} from "react"
import useMarket from "@/serves/useMarket";

export interface TokenPrice {
    [index: string]: number
}

export type Currencies = 'usd' | 'cny'

export interface MarketContextType {
    prices: TokenPrice,
    status: 'loading' | 'complete' | 'error'
    rates: {[index: string]: number},
    currCurrency: Currencies,
    setCurrCurrency: (currency: Currencies) => void
    currencySymbol: string
    setInternalAssetsMarket: (markets: {[index: string]: number}) => void
}

export const MarketContext = createContext<MarketContextType>({
    prices: {},
    status: 'loading',
    rates: {},
    currCurrency: 'usd',
    setCurrCurrency: (currency: Currencies) => {},
    currencySymbol: '$',
    setInternalAssetsMarket: (markets: {[index: string]: number}) => {}
})

export const CurrencySymbol = {
    usd: '$',
    cny: '¥'
}

export function MarketProvider({children}: {children: ReactNode}) {
    const [prices, setPrices] = useState<TokenPrice>({})
    const [rates, setRates] = useState<{[index: string]: number}>({})
    const [currCurrency, setCurrCurrency] = useState<'usd' | 'cny'>('usd')
    const [internalAssetsMarket, setInternalAssetsMarket] = useState<{[index: string]: number}>({})
    const {data, status:marketStatus} = useMarket()

    useEffect(() => {
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
            .then(res => res.json())
            .then(res => {
               setRates(res.rates)
            })
            .catch((e) => {
                console.error(e)
            })
    }, []);

    useEffect(() => {
        if (marketStatus === 'complete') {
            const res = {} as TokenPrice
            data.forEach(i => {
                res[i.symbol] = i.price
            })
            setPrices({...res, ...internalAssetsMarket})
        }
    }, [marketStatus, data, internalAssetsMarket])

    const currencySymbol = CurrencySymbol[currCurrency]

    return <MarketContext.Provider value={{prices, status: marketStatus, rates, currCurrency, setCurrCurrency, currencySymbol, setInternalAssetsMarket}}>
        {children}
    </MarketContext.Provider>
}


