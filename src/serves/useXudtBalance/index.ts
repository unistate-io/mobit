// @ts-ignore

import {useEffect, useState} from "react";
import {TokenBalance} from "@/components/ListToken/ListToken";
import {TokenInfo} from "@/utils/graphql/types";

import { Collector } from '@/libs/rgnpp_collector';
import {  leToU128 } from '@rgbpp-sdk/ckb';
import { addressToScript} from '@nervosnetwork/ckb-sdk-utils';

export const collector = new Collector({
    ckbNodeUrl: process.env.REACT_APP_CKB_RPC_URL!,
    ckbIndexerUrl: process.env.REACT_APP_CKB_INDEXER_URL!,
});

const emptyToken: TokenInfo = {
    decimal: 0,
    name: '',
    symbol: '--',
    type_id: '',
}


const getXudtBalance = async (address: string, tokenType: CKBComponents.Script) => {
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

    useEffect(() => {
        if (!address || !token) {
            setStatus('complete')
            setData({...emptyToken, amount: '0', type: 'xudt'})
            return
        }

        (async () => {
            setStatus('loading')
            const balance = await getXudtBalance(address, {
                codeHash: '0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95',
                hashType: 'data1',
                args: '0x6b33c69bdb25fac3d73e3c9e55f88785de27a54d722b4ab3455212f9a1b1645c'
            })
            setData({
                ...token,
                amount: balance,
                type: 'xudt'
            })
            setStatus('complete')
        })()
    }, [address, token])


    const refresh = async () => {
        if (!address || !token) {
            setStatus('complete')
            setData({...emptyToken, amount: '0', type: 'xudt'})
            return
        }

        setStatus('loading')
        const balance = await getXudtBalance(address, {
            codeHash: '0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95',
            hashType: 'data1',
            args: '0x6b33c69bdb25fac3d73e3c9e55f88785de27a54d722b4ab3455212f9a1b1645c'
        })
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
