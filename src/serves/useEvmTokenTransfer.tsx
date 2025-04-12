import { CKBContext } from "@/providers/CKBProvider/CKBProvider";
import { useContext, useMemo, useCallback } from "react";
import { SupportedChainMetadata } from "./useInternalAssets";

// 定义 MetaMask ethereum 对象的类型
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      utils?: {
        toWei: (value: string, unit: string) => string;
      };
      on: (eventName: string, handler: (params: any) => void) => void;
      removeListener: (eventName: string, handler: (params: any) => void) => void;
    };
  }
}

export default function useEvmTokenTransfer() {
    const { internalAddress, wallet } = useContext(CKBContext);

    const allowedTransfer = useMemo(() => {
        return wallet?.signer?.find((signer: any) => signer.name === 'EVM')
    }, [wallet]);

    // 切换网络函数
    const switchNetwork = useCallback(async (targetNetwork: string) => {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('evm wallet is not installed');
        }

        const networkConfig = SupportedChainMetadata.find(chain => chain.chain === targetNetwork);
        if (!networkConfig) {
            throw new Error(`Unsupported network: ${targetNetwork}`);
        }

        try {
            // 尝试切换到目标网络
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: networkConfig.chainId }],
            });
        } catch (switchError: any) {
            // 如果网络不存在，则添加网络
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: networkConfig.chainId,
                                chainName: networkConfig.name,
                                nativeCurrency: networkConfig.nativeCurrency,
                                rpcUrls: [networkConfig.rpcUrl],
                                blockExplorerUrls: networkConfig.blockExplorerUrls
                            },
                        ],
                    });
                } catch (addError) {
                    throw new Error(`Failed to add network: ${addError}`);
                }
            } else {
                throw new Error(`Failed to switch network: ${switchError.message}`);
            }
        }
    }, []);

    const transfer = useCallback(async (opts: {to: string, amount: string, network: string}) => {
        if (!allowedTransfer) {
            throw new Error('EVM signer not found');
        }
        
        try {
            // 检查 MetaMask 是否已安装
            if (typeof window.ethereum === 'undefined') {
                throw new Error('evm wallet is not installed');
            }
            
            // 获取当前账户
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }
            
            const fromAddress = accounts.find((account: string) => account === internalAddress);

            if (!fromAddress) {
                throw new Error('No from address found');
            }
            
            // 获取当前网络
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            const targetNetwork = opts.network;
            const targetChainConfig = SupportedChainMetadata.find(chain => chain.chain === targetNetwork);
            
            if (!targetChainConfig) {
                throw new Error(`Unsupported network: ${targetNetwork}`);
            }
            
            // 如果当前网络与目标网络不同，则切换网络
            if (currentChainId !== targetChainConfig.chainId) {
                await switchNetwork(targetNetwork);
            }
            
            // 将金额转换为 Wei (1 ETH = 10^18 Wei)
            // 使用 ethers.js 或其他库进行转换，因为 window.ethereum.utils 可能不存在
            const amountInWei = (BigInt(Math.floor(parseFloat(opts.amount) * 1e18))).toString();
            
            // 发送交易
            const transactionParameters = {
                from: fromAddress,
                to: opts.to,
                value: `0x${parseInt(amountInWei).toString(16)}`, // 转换为十六进制
                // 可选参数
                // gas: '0x5208', // 21000
                // gasPrice: '0x4a817c800', // 20000000000
            };
            
            // 使用 EIP-1193 标准发送交易
            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });
            
            return txHash;
        } catch (error) {
            console.error('Transfer failed:', error);
            throw error;
        }
    }, [allowedTransfer, internalAddress, switchNetwork]);

    return {
        allowedTransfer,
        transfer
    }
}