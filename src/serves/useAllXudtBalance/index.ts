import {queryAddressInfoWithAddress, queryXudtCell} from "@/utils/graphql"
// @ts-ignore
import BigNumber from "bignumber.js"
import {useEffect, useState, useRef, useContext} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

export const balance = async (addresses: string[], isMainnet: boolean): Promise<TokenBalance[]> => {
    const cells = await queryXudtCell(addresses, isMainnet)

    if (cells.length === 0) {
        console.log('enpty')
        return []
    }

    let typed_ids: string[] = []
    cells.forEach(c => {
        if (!typed_ids.includes(c.type_id)) {
            typed_ids.push(c.type_id)
        }
    })

    const tokensInfo = await queryAddressInfoWithAddress(typed_ids, isMainnet)

    const res = typed_ids.map(t => {
        const target_cells = cells.filter(vc => {
            return vc.type_id === t
        })

        const target_token = tokensInfo.find(token => {
            return token.type_id === t
        })

        if (!target_token) {
            return null
        }

        const sum = target_cells.reduce((prev, cur, index,) => {
            return prev.plus(BigNumber(cur.amount))
        }, BigNumber(0))

        return {
            ...target_token!,
            amount: sum.toString(),
            type: 'xudt',
            chain: 'ckb'
        }
    })

    return res.filter(t =>!!t) as TokenBalance[]
}

export default function useAllXudtBalance(addresses: string[]) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenBalance[]>([])
    const [error, setError] = useState<undefined | any>(undefined)
    const {network} = useContext(CKBContext)


    const historyRef = useRef('')

    useEffect(() => {
        if (!addresses || !addresses.length ||  historyRef.current === addresses.join(',')) return
        historyRef.current = addresses.join(',')
        setStatus('loading')
        setData([]);

        (async () => {
            try {
                const res = await balance(addresses, network === 'mainnet')
                setData(res)
                setStatus('complete')
            } catch (e: any) {
                console.error(e)
                setError(e)
                setStatus('error')
            }
        })()
    }, [addresses])

    return {
        status,
        data,
        error
    }
}
