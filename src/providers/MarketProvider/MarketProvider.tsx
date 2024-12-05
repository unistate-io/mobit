import {createContext, ReactNode, useEffect, useState} from "react"
import useMarket from "@/serves/useMarket";

export interface TokenPrice {
    [index: string]: number
}

export interface MarketContextType {
    prices: TokenPrice,
    status: 'loading' | 'complete' | 'error'
}

export const MarketContext = createContext<MarketContextType>({prices: {}, status: 'loading'})

export function MarketProvider({children}: {children: ReactNode}) {
    const [prices, setPrices] = useState<TokenPrice>({})

    const {data, status} = useMarket()

    useEffect(() => {
        if (status === 'complete') {
            const res = {} as TokenPrice
            data.forEach(i => {
                res[i.symbol] = i.price
            })
            setPrices(res)
        }
    }, [status, data]);

    return <MarketContext.Provider value={{prices, status}}>
        {children}
    </MarketContext.Provider>
}


