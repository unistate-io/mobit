// @ts-ignore

import {useContext, useEffect, useRef, useState, useCallback} from "react"
import {TokenBalance} from "@/components/ListToken/ListToken"
import {TokenInfo} from "@/utils/graphql/types"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

import {Collector} from '@/libs/rgnpp_collector'
import {leToU128} from '@rgbpp-sdk/ckb'
import {addressToScript} from '@nervosnetwork/ckb-sdk-utils'
import {queryAddressInfoWithAddress} from "@/utils/graphql";
import {hashType} from "@/serves/useXudtTransfer/lib";

const emptyToken: TokenInfo = {
    decimal: 0,
    name: '',
    symbol: '--',
    type_id: '',
}

const getXudtBalance = async (addresses: string[], tokenType: CKBComponents.Script, collector: Collector) => {
    const _locks = addresses.map(address => addressToScript(address))
    let _sum = BigInt(0)

    for (let i = 0; i < _locks.length; i++) {
        const xudtCells = await collector.getCells({
            lock: _locks[i],
            type: tokenType,
        });

        _sum += xudtCells.reduce((prev, current) => {
            return prev + leToU128(current.outputData)
        }, BigInt(0))
    }

    return _sum.toString()
}

export default function useXudtBalance(addresses?: string[], token?: TokenInfo) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenBalance>({...emptyToken, amount: '0', type: 'xudt', chain: 'ckb'})
    const [error, setError] = useState<undefined | any>(undefined)
    const {config} = useContext(CKBContext)

    const refresh = useCallback(async () => {
        if (!addresses || !addresses.length || !token) {
            setStatus('complete')
            setData({...emptyToken, amount: '0', type: 'xudt', chain: 'ckb'})
            return
        }


        setStatus('loading')

        const collector = new Collector({
            ckbNodeUrl: config.ckb_rpc,
            ckbIndexerUrl: config.ckb_indexer!,
        })

        const tokenInfo = await queryAddressInfoWithAddress([token.type_id])

        if (!tokenInfo[0]) {
            throw new Error('Token not found')
        }

        const balance = await getXudtBalance(addresses, {
            codeHash: tokenInfo[0].address.script_code_hash.replace('\\', '0'),
            hashType: hashType[tokenInfo[0].address.script_hash_type],
            args: tokenInfo[0].address.script_args.replace('\\', '0')
        }, collector)

        setData({
            ...token,
            amount: balance,
            type: 'xudt',
            chain: 'ckb'
        })
        setStatus('complete')
    }, [addresses, token, config])

    useEffect(() => {
        refresh()
    }, [addresses, token, config , refresh])




    return {
        status,
        data,
        error,
        refresh
    }
}
