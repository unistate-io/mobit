// @ts-ignore

import {useContext, useEffect, useState} from "react"
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

const getXudtBalance = async (address: string, tokenType: CKBComponents.Script, collector: Collector) => {
    const fromLock = addressToScript(address);

    const xudtCells = await collector.getCells({
        lock: fromLock,
        type: tokenType,
    });

    const sum = xudtCells.reduce((prev, current) => {
        return prev + leToU128(current.outputData)
    }, BigInt(0))

    return sum.toString()
}

export default function useXudtBalance(address: string, token?: TokenInfo) {
    const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const [data, setData] = useState<TokenBalance>({...emptyToken, amount: '0', type: 'xudt'})
    const [error, setError] = useState<undefined | any>(undefined)
    const {config} = useContext(CKBContext)

    useEffect(() => {
        if (!address || !token) {
            setStatus('complete')
            setData({...emptyToken, amount: '0', type: 'xudt'})
            return
        }

        (async () => {
            setStatus('loading')
            const collector = new Collector({
                ckbNodeUrl: config.ckb_rpc,
                ckbIndexerUrl: config.ckb_indexer!,
            })

            const tokenInfo = await queryAddressInfoWithAddress([token.type_id])

            if (!tokenInfo[0]) {
                throw new Error('Token not found')
            }

            const balance = await getXudtBalance(address, {
                codeHash: tokenInfo[0].address.script_code_hash.replace('\\', '0'),
                hashType: hashType[tokenInfo[0].address.script_hash_type],
                args: tokenInfo[0].address.script_args.replace('\\', '0')
            }, collector)

            setData({
                ...token,
                amount: balance,
                type: 'xudt'
            })
            setStatus('complete')
        })()
    }, [address, token, config])


    const refresh = async () => {
        if (!address || !token) {
            setStatus('complete')
            setData({...emptyToken, amount: '0', type: 'xudt'})
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

        const balance = await getXudtBalance(address, {
            codeHash: tokenInfo[0].address.script_code_hash.replace('\\', '0'),
            hashType: hashType[tokenInfo[0].address.script_hash_type],
            args: tokenInfo[0].address.script_args.replace('\\', '0')
        }, collector)

        setData({
            ...token,
            amount: balance,
            type: 'xudt'
        })
        setStatus('complete')
    }

    return {
        status,
        data,
        error,
        refresh
    }
}
