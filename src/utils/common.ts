import {helpers, config as lumosConfig} from "@ckb-lumos/lumos"
import {ccc} from "@ckb-ccc/connector-react"
import {getBtcTransactionsHistory} from "@/serves/useBtcTransactionsHistory"
import {ripemd160} from '@noble/hashes/ripemd160'
import {sha256} from '@noble/hashes/sha256'

export enum KnownScript {
    NervosDao = "NervosDao",
    Secp256k1Blake160 = "Secp256k1Blake160",
    Secp256k1Multisig = "Secp256k1Multisig",
    AnyoneCanPay = "AnyoneCanPay",
    TypeId = "TypeId",
    XUdt = "XUdt",
    JoyId = "JoyId",
    COTA = "COTA",
    PWLock = "PWLock",
    OmniLock = "OmniLock",
    NostrLock = "NostrLock",
    UniqueType = "UniqueType",

    // ckb-proxy-locks https://github.com/ckb-devrel/ckb-proxy-locks
    AlwaysSuccess = "AlwaysSuccess",
    InputTypeProxyLock = "InputTypeProxyLock",
    OutputTypeProxyLock = "OutputTypeProxyLock",
    LockProxyLock = "LockProxyLock",
    SingleUseLock = "SingleUseLock",
    TypeBurnLock = "TypeBurnLock",
    EasyToDiscoverType = "EasyToDiscoverType",
    TimeLock = "TimeLock",
}

export const checksumCkbAddress = (address: string, network: 'mainnet' | 'testnet'): boolean => {
    try {
        helpers.addressToScript(address, {config: network === 'mainnet' ? lumosConfig.MAINNET : lumosConfig.TESTNET})
        return true
    } catch (e: any) {
        console.log(e)
        return false
    }
}

export const isBtcAddress = (address: string, isMainnet = true): boolean => {
    if (isMainnet) {
        return address.startsWith('bc1')
    } else {
        return address.startsWith('tb1')
    }
}

export const isEvmAddress = (address: string): boolean => {
    return address.startsWith('0x') && address.length === 42
}

export const getInternalAddressChain = (address?: string): string | undefined => {
    if (!address) return undefined
    if (address.startsWith('ckb')) {
        return 'ckb'
    } else if (address.startsWith('ckt')) {
        return 'ckt'
    } else if (address.startsWith('0x')) {
        return 'evm'
    } else if (address.startsWith('bc1') || address.startsWith('tb1')) {
        return 'btc'
    }
    return undefined
}

export function shortTransactionHash(hash: string, keep?: number): string {
    const length = keep || 6
    return hash.slice(0, length) + '...' + hash.slice(hash.length - length)
}

export async function getCkbAddressFromEvm(address: string, client: any): Promise<string | null> {
    try {
        const _a = await ccc.Address.fromKnownScript(
            client,
            KnownScript.OmniLock as any,
            (ccc as any).hexFrom([0x12, ...(ccc as any).bytesFrom(address), 0x00]),
        )
        return _a.toString()
    } catch (e: any) {
        console.warn(e)
        return null
    }
}

export async function getCkbAddressFromBTC(address: string, client: any, isMainnet=true): Promise<string | null> {
    const txs = await getBtcTransactionsHistory(address, isMainnet)
    if (!txs.length) return null

    const utxo = txs[0].vin.find(v => {
        return v.prevout.scriptpubkey_address === address
    })
    if (!utxo) return null

    let pubkey: string | null = null
    utxo.witness.find(w => {
        if ((w.startsWith('02') || w.startsWith('04')) && w.length === 66) {
            pubkey = w
            return true
        }
        return false
    })

    if (!pubkey) return null

    try {
        const hash = ripemd160(sha256((ccc as any).bytesFrom('0x' + pubkey)));
        const _a = await (ccc as any).Address.fromKnownScript(
            KnownScript.OmniLock as any,
            (ccc as any).hexFrom([0x04, ...hash, 0x00]),
            client,
        )
        return _a.toString()
    } catch (e: any) {
        console.warn(e)
        return null
    }
}
