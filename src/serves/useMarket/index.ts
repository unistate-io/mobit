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
        fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=seal-2%2Cbitcoin%2Cnervos-network%2Cethereum%2Cmatic-network%2Coptimism",
            {
                method: "GET",
                headers: {
                    "x-cg-demo-api-key": process.env.REACT_APP_COINGECKO_API_KEY!
                }
            }
        )
            .then(res => res.json())
            .then(res => {
                const data = res
                    .map((item: any) => {
                        return {
                            id: item.symbol,
                            symbol: item.symbol.toUpperCase(),
                            price: item.current_price,
                            market_cap: item.market_cap,
                            change_1h: 0,
                            change_24h: item.price_change_percentage_24h,
                            change_7d: 0,
                            inserted_at: "",
                            updated_at: ""
                        }
                    })
                    .sort((a: TokenMarket, b: TokenMarket) => {
                        return a.symbol < b.symbol ? -1 : 1
                    })
                const usdi = {
                    id: 0,
                    symbol: "USDI",
                    price: 1,
                    market_cap: 0,
                    change_1h: 0,
                    change_24h: 0,
                    change_7d: 0,
                    inserted_at: "",
                    updated_at: ""
                }

                const rusd = {
                    id: 0,
                    symbol: "RUSD",
                    price: 1,
                    market_cap: 0,
                    change_1h: 0,
                    change_24h: 0,
                    change_7d: 0,
                    inserted_at: "",
                    updated_at: ""
                }

                const _data = [...data, usdi, rusd]
                console.log("_data", _data)
                setData(_data)
                setStatus("complete")
            })
            .catch((e: any) => {
                setError(e)
                setStatus("error")
            })
    }, [])

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
