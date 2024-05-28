export interface TokenInfo {
    name: string
    symbol: string
    address: string
    chain: string,
    icon: string
}

export interface ChainInfo {
    name: string
    icon: string
}

export const tokens: TokenInfo[] = [
    {
        name: 'Bitcoin',
        symbol: 'BTC',
        address: '0x',
        chain: 'Nervos CKB',
        icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579'
    },
    {
        name: 'Nervos CKB',
        symbol: 'CKB',
        address: '0x',
        chain: 'Nervos CKB',
        icon: 'https://ik.imagekit.io/soladata/cz1jz3ia_vC6yhYc7p'
    }
]

export const chains:ChainInfo[] = [
    {
        name: 'Bitcoin',
        icon: 'https://ik.imagekit.io/soladata/5veftj7e_LpXwtrv8H'
    },
    {
        name: 'Nervos CKB',
        icon: 'https://ik.imagekit.io/soladata/cz1jz3ia_vC6yhYc7p'
    }
]
