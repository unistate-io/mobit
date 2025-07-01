import {useEffect, useState, useContext} from "react"
import { CKBContext } from "@/providers/CKBProvider/CKBProvider"

export interface TokenMarket {
    id: number
    symbol: string
    price: number
    market_cap: number
    change_1h: number
    change_24h: number
    change_7d: number
    inserted_at: string
    updated_at: string
}

export default function useMarket() {
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [data, setData] = useState<TokenMarket[]>([])
    const [error, setError] = useState<undefined | any>(undefined)
    const {network} = useContext(CKBContext)
    
    useEffect(() => {
        if (network === 'testnet') {
            setStatus("complete")
            setData([])
            return
        }
        
        setStatus("loading")
        fetch("https://price-monitoring.unistate.io/api/prices/latest")
            .then(res => res.json())
            .catch((e: any) => {
                setError(e)
                setStatus("error")
            })
            .then(res => {
                const marketData = res.data
                .sort((a: TokenMarket, b: TokenMarket) => {
                    return a.symbol < b.symbol ? -1 : 1
                })
                .map((a: TokenMarket) => {
                    return {
                        ...a,
                        symbol: a.symbol
                    }
                })

                const deduplication = marketData.filter((item: TokenMarket, index: number, self: TokenMarket[]) =>
                    index === self.findIndex((t: TokenMarket) => t.symbol === item.symbol)
                )
            
                // add USDI to the market data
                const usdi = {
                    id: 0,
                    symbol: 'USDI',
                    price: 1,
                    market_cap: 0,
                    change_1h: 0,
                    change_24h: 0,
                    change_7d: 0,
                    inserted_at: '',
                    updated_at: ''
                }
                
                setData([...deduplication, usdi]
                )
                setStatus("complete")
            })
            .catch((e: any) => {
                setError(e)
                setStatus("error")
            })
    }, [])

    const appendMarkets = (markets: TokenMarket[]) => {
        if (network === 'testnet') return
        const newMarkets = data
        markets.forEach((item: TokenMarket) => {
            if (data.some((a: TokenMarket) => a.symbol !== a.symbol.toUpperCase())) {
                newMarkets.push(item)
            }
        })
        setData(newMarkets)
    }

    return {
        data,
        status,
        error,
        appendMarkets
    }
}
