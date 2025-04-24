import { CKBContext } from "@/providers/CKBProvider/CKBProvider";
import { useContext, useMemo, useCallback } from "react";
import useEvmNetwork from "./useEvmNetwork";

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
    const { internalAddress, wallet, network } = useContext(CKBContext);
    const SupportedEvmChainMetadata = useEvmNetwork()
    
    const allowedTransfer = useMemo(() => {
        return !!internalAddress 
         && !!wallet?.signers?.find((signer: any) => signer.name === 'EVM')
    }, [wallet, network, internalAddress]);

    // 切换网络函数
    const switchNetwork = useCallback(async (targetNetwork: string) => {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('evm wallet is not installed');
        }

        const networkConfig = SupportedEvmChainMetadata.find(chain => chain.chain === targetNetwork);
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
            const targetChainConfig = SupportedEvmChainMetadata.find(chain => chain.chain === targetNetwork);
            
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

    const transferErc20Token = useCallback(async (opts: { to: string, amount: string, network: string, tokenContract: string, decimals: number }) => {
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
                // 如果 internalAddress 不在 MetaMask 账户列表中，需要提示用户切换账户或进行处理
                // 这里暂时抛出错误，实际应用中可能需要更友好的交互
                throw new Error('Current internal address not found in MetaMask accounts. Please ensure the correct account is selected in MetaMask.');
            }

            // 获取当前网络并切换
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            const targetNetwork = opts.network;
            const targetChainConfig = SupportedEvmChainMetadata.find(chain => chain.chain === targetNetwork);

            if (!targetChainConfig) {
                throw new Error(`Unsupported network: ${targetNetwork}`);
            }

            if (currentChainId !== targetChainConfig.chainId) {
                await switchNetwork(targetNetwork);
                // 切换网络后可能需要重新获取 chainId，虽然 switchNetwork 内部处理了，但以防万一
                // const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
                // if (newChainId !== targetChainConfig.chainId) {
                //     throw new Error('Network switch failed or was rejected.');
                // }
            }

            // 构造 ERC20 transfer 数据
            // transfer(address,uint256) 的函数选择器
            const functionSignature = '0xa9059cbb';
            // 接收者地址，去掉 '0x' 前缀并左填充到 64 位（32 字节）
            const paddedToAddress = opts.to.startsWith('0x') ? opts.to.substring(2).padStart(64, '0') : opts.to.padStart(64, '0');

            // 金额处理：假设代币有 18 位小数 (需要根据实际代币调整)
            // 注意：直接使用 parseFloat 和 BigInt 可能丢失精度，对于需要高精度的场景建议使用 ethers.js 或 web3.js 的 utils
            // 暂时使用与 ETH 转账类似的方式，但需要注意这可能不适用于所有 ERC20 代币
            // TODO: 应该获取代币的 decimals 并据此计算 amountInSmallestUnit
            const amountInSmallestUnit = (BigInt(Math.floor(parseFloat(opts.amount) * (10 ** opts.decimals)))).toString(16);
            // 将金额转换为十六进制，并左填充到 64 位（32 字节）
            const paddedAmount = amountInSmallestUnit.padStart(64, '0');

            const transactionData = `${functionSignature}${paddedToAddress}${paddedAmount}`;

            // 发送交易
            const transactionParameters = {
                from: fromAddress,
                to: opts.tokenContract, // 发送到代币合约地址
                data: transactionData,   // 交易数据
                value: '0x0',          // ERC20 转账 value 为 0
                // 可选参数
                // gas: '...',
                // gasPrice: '...'
            };

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });

            return txHash;

        } catch (error) {
            console.error('ERC20 Transfer failed:', error);
            throw error;
        }
    }, [allowedTransfer, internalAddress, switchNetwork]);

    return {
        allowedTransfer,
        transfer,
        transferErc20Token
    }
}