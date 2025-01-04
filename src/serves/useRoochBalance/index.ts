import {useEffect, useMemo, useRef, useState} from "react";
import {useCurrentWallet, useRoochClient} from '@roochnetwork/rooch-sdk-kit'
import {TokenBalance} from "@/components/ListToken/ListToken";


export default function useRoochBalance(address?: string) {
    const client = useRoochClient()
    const [data, setData] = useState<TokenBalance | null>(null)
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const historyRef = useRef("")

    useEffect(() => {
        ;(async () => {
            const tokenBalance = {
                name: "Rooch Gas Coin",
                symbol: "RGAS",
                decimal: 8,
                type_id: "",
                type: "rooch",
                amount: '0',
                chain: "rooch",
                address: {
                    id: "",
                    script_args: "",
                    script_code_hash: "",
                    script_hash_type: ""
                },
                addressByInscriptionId: null
            } as TokenBalance
            if (!!client && !!address && address !== historyRef.current) {
                try {
                    setStatus("loading")
                    const res = await client.getBalance({
                        owner: address,
                        coinType: '0x3::gas_coin::RGas',
                    });

                    console.log('res =>', res)

                    if (res) {
                        tokenBalance.amount = BigInt(res.balance).toString()
                        setData(tokenBalance)
                    } else {
                        setData(tokenBalance)
                    }

                    historyRef.current = address
                } finally {
                    setStatus("complete")
                }
            } else {
                historyRef.current = ""
                setData(tokenBalance)
            }
        })()
    }, [client, address]);

    return {
        data,
        status
    }
}