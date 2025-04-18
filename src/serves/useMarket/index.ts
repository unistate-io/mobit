import {useEffect, useState} from "react"

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

    useEffect(() => {
        setStatus("loading")
        fetch("https://price-monitoring.unistate.io/api/prices/latest")
            .then(res => res.json())
            .catch((e: any) => {
                setError(e)
                setStatus("error")
            })
            .then(res => {
                setData(
                    res.data
                        .sort((a: TokenMarket, b: TokenMarket) => {
                            return a.symbol < b.symbol ? -1 : 1
                        })
                        .map((a: TokenMarket) => {
                            return {
                                ...a,
                                symbol: a.symbol.toUpperCase()
                            }
                        })
                )
                setStatus("complete")
            })
            .catch((e: any) => {
                setError(e)
                setStatus("error")
            })
    }, [])

    const appendMarkets = (markets: TokenMarket[]) => {
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
