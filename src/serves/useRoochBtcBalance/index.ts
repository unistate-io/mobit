import {useEffect, useMemo, useRef, useState} from "react";
import {useCurrentWallet} from '@roochnetwork/rooch-sdk-kit'
import {TokenBalance} from "@/components/ListToken/ListToken";


export default function useRoochBtcBalance(btcAddress?: string) {
    const currentWallet = useCurrentWallet()
    const [data, setData] = useState<TokenBalance | null>(null)
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const historyRef = useRef("")

    useEffect(() => {
        ;(async () => {
            const tokenBalance = {
                decimal: 8,
                name: "Bitcoin",
                symbol: "BTC",
                type_id: "",
                amount: '0',
                type: "btc",
                chain: "btc"
            } as TokenBalance

            if (!btcAddress) {
                setData(null)
                setStatus("complete")
                historyRef.current = ""
                return
            }

            if (!!currentWallet && !!btcAddress && btcAddress !== historyRef.current) {
                try {
                    setStatus("loading")
                    const res = await currentWallet.wallet?.getBalance();
                    if (res) {
                        tokenBalance.amount = res.total.toString()
                        setData({...tokenBalance})
                    } else {
                        setData(tokenBalance)
                    }

                    historyRef.current = btcAddress
                } finally {
                    setStatus("complete")
                }
            }
        })()
    }, [currentWallet, btcAddress]);

    return {
        data,
        status
    }
}