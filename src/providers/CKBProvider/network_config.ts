export interface NetworkConfig {
    ckb_rpc: string,
    ckb_indexer: string,
    explorer: string,
    explorer_api: string
}

const network_config: {
    mainnet: NetworkConfig,
    testnet: NetworkConfig
} = {
    mainnet: {
        ckb_rpc: 'https://mainnet.ckbapp.dev',
        ckb_indexer: 'https://mainnet.ckbapp.dev/indexer',
        explorer: 'https://explorer.nervos.org',
        explorer_api: 'https://try.readme.io/https://mainnet-api.explorer.nervos.org/api/v1',
    },
    testnet: {
        ckb_rpc: 'https://testnet.ckbapp.dev',
        ckb_indexer: 'https://testnet.ckb.dev',
        explorer: 'https://pudge.explorer.nervos.org',
        explorer_api: 'https://try.readme.io/https://testnet-api.explorer.nervos.org/api/v1',
    }
}

export default network_config
