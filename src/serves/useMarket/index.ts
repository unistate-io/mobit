import {useEffect, useState, useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

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

const stable = (symbol: string): TokenMarket => ({
    id: 0,
    symbol,
    price: 1,
    market_cap: 0,
    change_1h: 0,
    change_24h: 0,
    change_7d: 0,
    inserted_at: "",
    updated_at: ""
})

export default function useMarket() {
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [data, setData] = useState<TokenMarket[]>([])
    const [error, setError] = useState<undefined | any>(undefined)
    const {network} = useContext(CKBContext)

    useEffect(() => {
        if (network === "testnet") {
            setStatus("complete")
            setData([])
            return
        }

        setStatus("loading")
        fetch(`${import.meta.env.VITE_MARKET_API}/api/market`)
            .then(res => res.json())
            .then(res => {
                const marketData: TokenMarket[] = (res.data ?? [])
                    .slice()
                    .sort((a: TokenMarket, b: TokenMarket) => (a.symbol < b.symbol ? -1 : 1))

                const deduplication = marketData.filter(
                    (item, index, self) => index === self.findIndex(t => t.symbol === item.symbol)
                )

                setData([...deduplication, stable("USDI"), stable("RUSD")])
                setStatus("complete")
            })
            .catch((e: any) => {
                setError(e)
                setStatus("error")
            })
    }, [network])

    const appendMarkets = (markets: TokenMarket[]) => {
        if (network === "testnet") return
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
