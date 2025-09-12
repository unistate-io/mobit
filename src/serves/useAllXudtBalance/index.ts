import {queryXudtCell} from "@/utils/graphql"
// @ts-ignore
import BigNumber from "bignumber.js"
import {useEffect, useState, useRef, useContext} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {TokenInfo, XudtCell} from "@/utils/graphql/types"
import {getXudtCompatibleInfo} from "@/utils/xudt-compatible"

export const balance = async (addresses: string[], isMainnet: boolean): Promise<TokenBalance[]> => {
    const cells = await queryXudtCell(addresses, isMainnet)

    if (cells.length === 0) {
        console.log("empty")
        return []
    }

    let list: XudtCell[] = []
    cells.forEach(c => {
        const exist = list.find(l => l.type_address_id === c.type_address_id)
        if (!exist) {
            c.amount = c.amount.toString()
            list.push(c)
        } else {
            exist.amount = BigNumber(exist.amount).plus(BigNumber(c.amount)).toString()
        }
    })

    const _list = list.map(_l => {
        let tokenInfo = _l.token_info_by_type_address_id

        // USDI xudt
        const compatibleInfo = getXudtCompatibleInfo(_l.type_address_id)
        if (compatibleInfo) {
            tokenInfo = {
                    name: compatibleInfo.name,
                    symbol: compatibleInfo.symbol,
                    decimal: compatibleInfo.decimal,
                    defining_tx_hash: '',
                    type_address_id: compatibleInfo.type_address_id
            } as TokenInfo
        }

        return {
            amount: _l.amount,
            type: "xudt",
            chain: "ckb",
            decimal: tokenInfo?.decimal ?? 8,
            name: tokenInfo?.name || "",
            symbol: tokenInfo?.symbol || "UNKNOWN ASSET",
            type_address_id: _l.type_address_id,
            defining_tx_hash: tokenInfo?.defining_tx_hash || "",
            defining_output_index: tokenInfo?.defining_output_index || 0,
            address_by_type_address_id: _l.address_by_type_address_id,
            inscription_address_id: tokenInfo?.inscription_address_id
        } as TokenBalance
    })

    return _list
}

export default function useAllXudtBalance(addresses: string[]) {
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [data, setData] = useState<TokenBalance[]>([])
    const [error, setError] = useState<undefined | any>(undefined)
    const {network} = useContext(CKBContext)

    const historyRef = useRef("")

    useEffect(() => {
        if (!addresses || !addresses.length || historyRef.current === addresses.join(",")) return
        historyRef.current = addresses.join(",")
        setStatus("loading")
        setData([])
        ;(async () => {
            try {
                const res = await balance(addresses, network === "mainnet")
                setData(res)
                setStatus("complete")
            } catch (e: any) {
                console.error(e)
                setError(e)
                setStatus("error")
            }
        })()
    }, [addresses])

    return {
        status,
        data,
        error
    }
}
