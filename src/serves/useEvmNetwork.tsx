import {useContext, useMemo} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

export const SupportedChainMetadata = [
    {
        chain: "eth-mainnet",
        name: "Ethereum",
        tokenSymbol: "ETH",
        chainId: "0x1",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://etherscan.io"]
    },
    {
        chain: "base-mainnet",
        tokenSymbol: "ETH",
        name: "Base",
        chainId: "0x2105",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://basescan.org"]
    },
    {
        chain: "polygon-mainnet",
        tokenSymbol: "MATIC",
        name: "Matic",
        chainId: "0x89",
        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
        blockExplorerUrls: ["https://polygonscan.com"]
    },
    {
        chain: "arb-mainnet",
        tokenSymbol: "ARB",
        name: "Arbitrum",
        chainId: "0xa4b1",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://arbiscan.io"]
    },
    {
        chain: "opt-mainnet",
        tokenSymbol: "OP",
        name: "Optimism",
        chainId: "0xa",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://optimistic.etherscan.io"]
    }
]

export const SupportedTestnetChainMetadata = [
    {
        chain: "eth-sepolia",
        name: "Ethereum",
        tokenSymbol: "ETH",
        chainId: "0xaa36a7",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.etherscan.io/"]
    },
    {
        chain: "base-sepolia",
        name: "Base",
        tokenSymbol: "ETH",
        chainId: "0x14a33",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.basescan.org/"]
    },
    {
        chain: "polygon-amoy",
        name: "Matic",
        tokenSymbol: "MATIC",
        chainId: "0x13881",
        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
        blockExplorerUrls: ["https://mumbai.polygonscan.com"]
    },
    {
        chain: "arb-sepolia",
        name: "Arbitrum",
        tokenSymbol: "ARB",
        chainId: "0x66eee",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.arbiscan.io/"]
    },
    {
        chain: "opt-sepolia",
        name: "Optimism",
        tokenSymbol: "OP",
        chainId: "0x1a4",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia-optimism.etherscan.io"]
    }
]

// The `chain` field doubles as the Alchemy network slug, so the RPC URL handed
// to the wallet (via wallet_addEthereumChain) is derived rather than hardcoded.
const alchemyRpcUrl = (chain: string) =>
    `https://${chain}.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_API_KEY}`

export default function useEvmNetwork() {
    const {network} = useContext(CKBContext)
   const SupportedEvmChainMetadata = useMemo(() => {
    const chains = network !== "mainnet" ? SupportedTestnetChainMetadata : SupportedChainMetadata
    return chains.map(c => ({...c, rpcUrl: alchemyRpcUrl(c.chain)}))
   }, [network])


   return SupportedEvmChainMetadata
}
