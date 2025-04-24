import {useContext, useMemo} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"

export const SupportedChainMetadata = [
    {
        chain: "eth-mainnet",
        name: "Ethereum",
        tokenSymbol: "ETH",
        chainId: "0x1",
        rpcUrl: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://etherscan.io"]
    },
    {
        chain: "base-mainnet",
        tokenSymbol: "ETH",
        name: "Base",
        chainId: "0x2105",
        rpcUrl: `https://base-mainnet.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://basescan.org"]
    },
    {
        chain: "polygon-mainnet",
        tokenSymbol: "MATIC",
        name: "Matic",
        chainId: "0x89",
        rpcUrl: `https://polygon-mainnet.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
        blockExplorerUrls: ["https://polygonscan.com"]
    },
    {
        chain: "arb-mainnet",
        tokenSymbol: "ARB",
        name: "Arbitrum",
        chainId: "0xa4b1",
        rpcUrl: `https://arbitrum-mainnet.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://arbiscan.io"]
    },
    {
        chain: "opt-mainnet",
        tokenSymbol: "OP",
        name: "Optimism",
        chainId: "0xa",
        rpcUrl: `https://optimism-mainnet.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
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
        rpcUrl: `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.etherscan.io/"]
    },
    {
        chain: "base-sepolia",
        name: "Base",
        tokenSymbol: "ETH",
        chainId: "0x14a33",
        rpcUrl: `https://base-sepolia.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.basescan.org/"]
    },
    {
        chain: "polygon-amoy",
        name: "Matic",
        tokenSymbol: "MATIC",
        chainId: "0x13881",
        rpcUrl: `https://polygon-amoy.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
        blockExplorerUrls: ["https://mumbai.polygonscan.com"]
    },
    {
        chain: "arb-sepolia",
        name: "Arbitrum",
        tokenSymbol: "ARB",
        chainId: "0x66eee",
        rpcUrl: `https://arbitrum-sepolia.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia.arbiscan.io/"]
    },
    {
        chain: "opt-sepolia",
        name: "Optimism",
        tokenSymbol: "OP",
        chainId: "0x1a4",
        rpcUrl: `https://optimism-sepolia.infura.io/v3/${process.env.REACT_APP_INFUFA_API_KEY}`,
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: ["https://sepolia-optimism.etherscan.io"]
    }
]

export default function useEvmNetwork() {
    const {network} = useContext(CKBContext)
   const SupportedEvmChainMetadata = useMemo(() => {
    if (network !== "mainnet") {
        return SupportedTestnetChainMetadata
    }
    return SupportedChainMetadata  
   }, [network])

   
   return SupportedEvmChainMetadata
}
