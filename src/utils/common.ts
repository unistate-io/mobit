import {helpers} from "@ckb-lumos/lumos";

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
