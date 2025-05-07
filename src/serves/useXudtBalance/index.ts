// @ts-ignore

import {useCallback, useContext, useEffect, useRef, useState} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {tokenInfoToScript, TokenInfoWithAddress} from "@/utils/graphql/types"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

import {Collector} from "@/libs/rgnpp_collector"
import {leToU128} from "@rgbpp-sdk/ckb"
import {addressToScript} from "@nervosnetwork/ckb-sdk-utils"

const emptyToken: TokenInfoWithAddress = {
    decimal: 0,
    name: "",
    symbol: "--",
    defining_tx_hash: "",
    defining_output_index: 0,
    type_address_id: "",
    block_number: "",
    tx_timestamp: "",
    address_by_type_address_id: {
        address_id: "",
        script_args: "",
        script_code_hash: "",
        script_hash_type: 0
    },
    address_by_inscription_address_id: undefined
}

export const getXudtBalance = async (addresses: string[], tokenType: CKBComponents.Script, collector: Collector) => {
    const _locks = addresses.map(address => addressToScript(address))
    let _sum = BigInt(0)

    for (let i = 0; i < _locks.length; i++) {
        const xudtCells = await collector.getCells({
            lock: _locks[i],
            type: tokenType
        })

        _sum += xudtCells.reduce((prev, current) => {
            return prev + leToU128(current.outputData)
        }, BigInt(0))
    }

    return _sum.toString()
}

export default function useXudtBalance(addresses?: string[], token?: TokenInfoWithAddress) {
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [data, setData] = useState<TokenBalance>({
        ...emptyToken,
        amount: "0",
        type: "xudt",
        chain: "ckb"
    } as TokenBalance)
    const {config} = useContext(CKBContext)

    const addressesHistoryRef = useRef('')
    const tokenSymbolRef = useRef('')

    const refresh = async () => {
        setStatus("loading")

        const collector = new Collector({
            ckbNodeUrl: config.ckb_rpc,
            ckbIndexerUrl: config.ckb_indexer!
        })

        console.log('load ====>')
        const tokenScript = tokenInfoToScript(token!)
        if (!tokenScript) {
            setStatus("complete")
            return
        }

        const balance = await getXudtBalance(addresses!, tokenScript, collector)

        setData({
            ...token,
            amount: balance,
            type: "xudt",
            chain: "ckb"
        } as TokenBalance)
        setStatus("complete")
    }

    useEffect(() => {
        if (!addresses || !addresses.length || !token) {
            setStatus("complete")
            setData({...emptyToken, amount: "0", type: "xudt", chain: "ckb"} as TokenBalance)
            return
        }


        if (addressesHistoryRef.current !== addresses?.join(',') || tokenSymbolRef.current !== token?.symbol) {
            addressesHistoryRef.current = addresses?.join(',') || ''
            tokenSymbolRef.current = token?.symbol || ''
            refresh()
        }
    }, [addresses, token])

   

    useEffect(() => {
        console.log('token', token)
    }, [token])

    return {
        status,
        data,
        refresh
    }
}
