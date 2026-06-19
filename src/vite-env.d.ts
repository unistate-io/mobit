/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_MARKET_API: string
    readonly VITE_UTXO_SWAP_KEY: string
    readonly VITE_COINGECKO_API_KEY: string
    readonly VITE_ALCHEMY_API_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
