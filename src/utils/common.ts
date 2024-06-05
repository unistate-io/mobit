import {helpers} from "@ckb-lumos/lumos";

export const checksumCkbAddress = (address: string): boolean => {
    try {
        helpers.parseAddress(address)
        return true
    } catch (e: any) {
        return false
    }
}

export function shortTransactionHash(hash: string): string {
    return hash.slice(0, 6) + '...' + hash.slice(hash.length - 4)
}
