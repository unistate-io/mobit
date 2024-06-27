import {helpers} from "@ckb-lumos/lumos"
import {ccc} from "@ckb-ccc/connector-react"
import {Client} from "@ckb-ccc/core/dist.commonjs";

enum KnownScript {
    Secp256k1Blake160,
    Secp256k1Multisig,
    AnyoneCanPay,
    JoyId,
    COTA,
    OmniLock,
}

export const checksumCkbAddress = (address: string): boolean => {
    try {
        helpers.parseAddress(address)
        return true
    } catch (e: any) {
        return false
    }
}

export function shortTransactionHash(hash: string, keep?: number): string {
    const length = keep || 6
    return hash.slice(0, length) + '...' + hash.slice(hash.length - length)
}

export async function getCkbAddressFromEvm(address: string, client: Client): Promise<string | null> {
    try {
        const _a = await (ccc as any).Address.fromKnownScript(
            KnownScript.OmniLock as any,
            (ccc as any).hexFrom([0x12, ...(ccc as any).bytesFrom(address), 0x00]),
            client,
        )
        return _a.toString()
    } catch (e: any) {
        console.warn(e)
        return null
    }
}
