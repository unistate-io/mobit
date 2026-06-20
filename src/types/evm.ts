// Minimal local replacement for alchemy-sdk's TokenMetadataResponse.
// Only the fields consumed by the EVM token UI are kept; lets us drop the
// alchemy-sdk dependency (it was used type-only).
export interface TokenMetadataResponse {
    name: string | null
    symbol: string | null
    decimals: number | null
    logo: string | null
}
