
export function toValue (numStr: string, decimal: number, split?: boolean): string {
    const num = BigInt(numStr)
    const d = BigInt(10 ** decimal)

    if (split) {
        return (num * d).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    } else {
        return (num * d).toString()
    }
}

export function toDisplay (numStr: string, decimal: number, split?: boolean): string {
    const num = BigInt(numStr)
    const d = BigInt(10 ** decimal)

    if (split) {
        return (num / d).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    } else {
        return (num / d).toString()
    }
}

export function shortTransactionHash (hash: string): string {
    return hash.slice(0, 6) + '...' + hash.slice(hash.length - 4)
}
