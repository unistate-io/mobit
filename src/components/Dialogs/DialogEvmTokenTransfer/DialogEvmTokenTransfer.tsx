import React, {useContext, useEffect} from 'react'
import Input from "@/components/Form/Input/Input"
import * as Dialog from '@radix-ui/react-dialog'
import Button from "@/components/Form/Button/Button"
import {shortTransactionHash} from "@/utils/common"
import BigNumber from "bignumber.js"
import {toDisplay} from "@/utils/number_display"
import useEvmTokenTransfer from "@/serves/useEvmTokenTransfer"
import {ChainIcons} from "@/components/TokenIcon/icons"
import CopyText from "@/components/CopyText/CopyText"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import {SupportedChainMetadata} from "@/serves/useInternalAssets"
import { type TokenMetadataResponse } from 'alchemy-sdk';
import TokenIcon from '@/components/TokenIcon/TokenIcon'

import * as dayjsLib from "dayjs"
const dayjs: any = dayjsLib

// 定义新的 formData 状态接口，使用 metadata 和 tokenContract
export interface EvmTokenTransferFormData {
    network: string;
    amount: string;
    to: string;
    metadata: TokenMetadataResponse | null; // 使用 metadata 对象，允许为 null
    tokenContract: string; // 明确需要 tokenContract
}

// 定义组件 Props，使用 metadata 和 tokenContract
export interface DialogEvmTokenTransferProps {
    children: React.ReactNode;
    className?: string;
    network: string;
    metadata: TokenMetadataResponse | null; // 接受 metadata 对象，允许为 null
    tokenContract: string; // 明确接受 tokenContract
}

// 重命名组件
export default function DialogEvmTokenTransfer({
    children,
    className,
    network,
    metadata, // 接受 metadata prop
    tokenContract // 接受 tokenContract prop
}: DialogEvmTokenTransferProps) {
    // 从 hook 中获取 transferErc20Token 方法
    const { transferErc20Token } = useEvmTokenTransfer()
    const {lang} = useContext(LangContext)
    const {internalAddress} = useContext(CKBContext)

    const [open, setOpen] = React.useState(false);

    // 更新 formData 状态以包含 metadata 和 tokenContract
    const [formData, setFormData] = React.useState<EvmTokenTransferFormData>({
        network: network === 'matic-mainnet' ? 'polygon-mainnet' : network,
        amount: "",
        to: "",
        metadata: metadata, // 初始化 metadata
        tokenContract: tokenContract // 初始化 tokenContract
    });

    const [balance, setBalance] = React.useState<string>('0')
    const [step, setStep] = React.useState<1 | 2 | 3>(1)
    const [sending, setSending] = React.useState(false)
    const [txHash, setTxHash] = React.useState<null | string>(null)
    const [loadingBalance, setLoadingBalance] = React.useState(false)

    // errors
    const [toError, setToError] = React.useState<string>('')
    const [amountError, setAmountError] = React.useState<string>('')
    const [transactionError, setTransactionError] = React.useState<string>('')

    // 修改 getBalance 以获取 ERC20 余额，使用 formData.tokenContract
    const getBalance = async () => {
        // 使用 formData.tokenContract 作为 token_address
        if (!formData.network || !formData.tokenContract || !internalAddress) return
        setLoadingBalance(true)
        try {
            const res = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/token_balance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: internalAddress,
                    network: formData.network,
                    token_address: formData.tokenContract // 使用 formData.tokenContract
                })
            })
            const data = await res.json()
            setBalance(data?.balance || '0')
        } catch (error) {
            console.error("getBalance error", error)
            setBalance('0')
        } finally {
            setLoadingBalance(false)
        }
    }

    // 检查错误并构建，使用 metadata.decimals
    const checkErrorsAndBuild = async () => {
        let hasError = false

        if (formData.to === '') {
            setToError('请输入有效的地址')
            hasError = true
        } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.to)) {
            setToError('无效的EVM地址')
            hasError = true
        } else {
            setToError('')
        }

        const amountBN = BigNumber(formData.amount || '0');
        const balanceBN = BigNumber(balance || '0'); // 假设 balance 是以最小单位存储的
        const decimals = formData.metadata?.decimals ?? 18; // 从 metadata 获取 decimals，提供默认值

        if (formData.amount === '') {
            setAmountError('请输入有效金额')
            hasError = true
        } else if (amountBN.lte(0)) {
            setAmountError('请输入大于0的金额')
            hasError = true
        } else if (amountBN.shiftedBy(decimals).gt(balanceBN)) { // 使用 metadata.decimals 转换
             setAmountError('余额不足')
             hasError = true
        } else {
            setAmountError('')
        }

        if (formData.network === '') {
            setAmountError('请选择网络')
            hasError = true
        }

        return !hasError
    }

    // 设置最大金额，使用 metadata.decimals
    const setMaxAmount = () => {
        const decimals = formData.metadata?.decimals ?? 18; // 从 metadata 获取 decimals
        setFormData({
            ...formData,
            amount: balance ? BigNumber(balance).shiftedBy(-decimals).toString() : '0' // 使用 metadata.decimals 转换
        })
    }

    // handleTransfer 逻辑不变
    const handleTransfer = async () => {
        setSending(true)
        const isValid = await checkErrorsAndBuild()
        if (isValid) {
            setStep(2)
        }
        setSending(false)
    }

    // 修改 HandleSignAndSend 以调用 transferErc20Token，使用 metadata
    const HandleSignAndSend = async () => {
        setSending(true)
        setTransactionError('')
        try {
            // 确保 tokenContract 和 decimals 存在
            const decimals = formData.metadata?.decimals ?? 18; // 提供默认值
            if (!formData.tokenContract || typeof decimals === 'undefined') {
                throw new Error("代币信息不完整");
            }
            const txHash = await transferErc20Token({
                to: formData.to,
                amount: formData.amount,
                network: formData.network,
                tokenContract: formData.tokenContract, // 使用 formData.tokenContract
                decimals: decimals    // 使用处理了 null 的 decimals
            })
            console.log(txHash)
            setTxHash(txHash)
            setStep(3)
        } catch (e:any) {
            console.error(e)
             let message = '交易失败';
             if (e.message) {
                 message = e.message;
                 if (e.code === 4001) message = '用户拒绝了交易签名';
                 if (e.message.includes('insufficient funds')) message = '链上原生代币余额不足以支付 Gas 费';
             } else if (typeof e === 'string') {
                 message = e;
             }
             setTransactionError(message);
        } finally {
            setSending(false)
        }
    }

    // useEffect 逻辑，依赖项更新为 metadata
    useEffect(() => {
        setStep(1)
        // 更新 formData 当 props 变化时
        setFormData({
            network: network === 'matic-mainnet' ? 'polygon-mainnet' : network,
            amount: "",
            to: "",
            metadata: metadata, // 使用新的 metadata prop 更新
            tokenContract: tokenContract // 使用新的 tokenContract prop 更新
        })

        // 使用 tokenContract 检查
        if (open && internalAddress && tokenContract) {
            getBalance() // 获取代币余额
        }

        if (!open) {
            setAmountError('')
            setToError('')
            setTransactionError('')
        }
        // 更新依赖项
    }, [open, network, metadata, tokenContract, internalAddress])

    useEffect(() => {
        setAmountError('')
        setToError('')
        setTransactionError('')
    }, [step])

    const chainMetadata = SupportedChainMetadata.find(m => m.chain === formData.network)

    // 用于显示的代币图标，优先使用 metadata.logo
    const displayTokenIcon = formData.metadata?.logo || (chainMetadata && ChainIcons[chainMetadata.chain]);
    // 用于显示的代币符号
    const displayTokenSymbol = formData.metadata?.symbol ?? ''; // 从 metadata 获取 symbol
    // 用于显示的代币 decimals
    const displayTokenDecimals = formData.metadata?.decimals ?? 18; // 从 metadata 获取 decimals

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className={className}>
                {children}
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0"/>
                <Dialog.Content
                    onPointerDownOutside={e=> {e.preventDefault()}}
                    className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] p-4 max-w-[98vw] w-full md:max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
                    <div className="h-full overflow-auto max-h-[88vh] w-full">
                        {step === 1 &&
                            <>
                                <div className="flex flex-row justify-between items-center mb-4">
                                    {/* 使用 displayTokenSymbol */}
                                    <div className="font-semibold text-2xl">{lang['Transfer']} {displayTokenSymbol}</div>
                                    <div onClick={e => {
                                        setOpen(false)
                                    }}
                                         className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100">
                                        <i className="uil-times text-gray-500"/>
                                    </div>
                                </div>

                                <div className="font-semibold mb-10">
                                    <div className="mb-2">
                                        {lang['Send to']}
                                    </div>
                                    <Input value={formData.to}
                                           placeholder={lang['Recipient address']}
                                           type={"text"}
                                           onChange={e => {
                                               setFormData({...formData, to: e.target.value})
                                           }}/>
                                    <div className="font-normal text-red-400 mt-1">{toError}</div>
                                </div>

                                <div className="font-semibold mb-10">
                                    <div className="mb-2 flex-row flex items-center justify-between">
                                        <div>{lang['Amount']}</div>
                                        <div className="font-normal flex items-center">
                                            <span className="text-gray-500 mr-1"> {lang['Balance']}: </span>
                                            {loadingBalance ?
                                                <div className="loading-bg h-[20px] w-[100px] rounded inline-block"/> :
                                                // 使用 displayTokenDecimals 和 displayTokenSymbol
                                                toDisplay(balance || '0', displayTokenDecimals, true)
                                            }
                                            <span className="ml-1">{displayTokenSymbol}</span>
                                        </div>
                                    </div>
                                    <Input value={formData.amount}
                                           type={"number"}
                                           placeholder={lang['Transfer amount']}
                                           onChange={e => {
                                               setFormData({...formData, amount: e.target.value})
                                           }}
                                           endIcon={<div className="cursor-pointer text-[#6CD7B2]"
                                                         onClick={setMaxAmount}>Max</div>}
                                    />
                                    <div className="font-normal text-red-400 mt-1">{amountError}</div>
                                </div>

                                <Button btntype={'primary'}
                                        loading={loadingBalance || sending}
                                        disabled={loadingBalance || sending || !formData.to || !formData.amount || !formData.tokenContract} // 确保 tokenContract 存在
                                        onClick={handleTransfer}>
                                    Continue
                                </Button>
                            </>
                        }

                        {
                            step === 2 &&
                            <>
                                <div className="flex flex-row justify-between items-center mb-4">
                                    <div className="font-semibold text-2xl">{lang['Sign Transaction']}</div>
                                     <div onClick={e => {
                                        setOpen(false)
                                    }}
                                         className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100">
                                        <i className="uil-times text-gray-500"/>
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <div className="mb-2 font-semibold">
                                        {lang['Send Token']}
                                    </div>
                                    <div className="flex flex-row flex-nowrap justify-between items-center mb-2 text-sm">
                                        <div className="flex flex-row flex-nowrap items-center">
                                            {/* 使用 displayTokenIcon 和 displayTokenSymbol */}
                                            <TokenIcon symbol={displayTokenSymbol} size={18} chain={formData.network}  />
                                            {displayTokenSymbol}
                                        </div>
                                        {/* 使用 displayTokenSymbol */}
                                        <div className="font-semibold">{formData.amount} {displayTokenSymbol}</div>
                                    </div>

                                    <div className="flex flex-row flex-nowrap justify-between items-center text-sm">
                                        <div className="flex flex-row flex-nowrap items-center">
                                            {lang['To Address']}
                                        </div>
                                        <div>{shortTransactionHash(formData.to)}</div>
                                    </div>

                                    <div className="my-4 h-[1px] bg-gray-100 w-full" />

                                    <div className="mb-2 font-semibold">
                                        {lang['Network']}
                                    </div>
                                    <div className="flex flex-row flex-nowrap items-center text-sm">
                                        {/* 显示网络图标和名称 */}
                                        {chainMetadata && ChainIcons[chainMetadata.chain] &&
                                            <img src={ChainIcons[chainMetadata.chain]} width={18} height={18} className="mr-2" alt={chainMetadata.name}/>
                                        }
                                        {chainMetadata?.name}
                                    </div>
                                </div>

                                <div className="text-red-400 min-h-6 mb-2">{transactionError}</div>

                                <div className="flex flex-row">
                                    <Button btntype={'secondary'}
                                            className="mr-4"
                                            loading={false} // 第二步不应显示 loadingBalance
                                            disabled={sending}
                                            onClick={e => {setStep(1)}}>
                                        {lang['Cancel']}
                                    </Button>
                                    <Button btntype={'primary'}
                                            loading={sending}
                                            onClick={HandleSignAndSend}>
                                        {lang['Transfer']}
                                    </Button>
                                </div>

                            </>
                        }

                        {
                            step === 3 &&
                            <>
                                {/* 成功界面 */}
                                <div className="flex flex-row justify-center items-center mb-4 mt-2">
                                    <svg width="73" height="72" viewBox="0 0 73 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g clipPath="url(#clip0_699_1259)">
                                            <circle cx="36.5" cy="36" r="36" fill="#41D195" fillOpacity="0.12"/>
                                            <path d="M37 19.3335C27.8167 19.3335 20.3333 26.8168 20.3333 36.0002C20.3333 45.1835 27.8167 52.6668 37 52.6668C46.1833 52.6668 53.6667 45.1835 53.6667 36.0002C53.6667 26.8168 46.1833 19.3335 37 19.3335ZM44.9667 32.1668L35.5167 41.6168C35.2833 41.8502 34.9667 41.9835 34.6333 41.9835C34.3 41.9835 33.9833 41.8502 33.75 41.6168L29.0333 36.9002C28.55 36.4168 28.55 35.6168 29.0333 35.1335C29.5167 34.6502 30.3167 34.6502 30.8 35.1335L34.6333 38.9668L43.2 30.4002C43.6833 29.9168 44.4833 29.9168 44.9667 30.4002C45.45 30.8835 45.45 31.6668 44.9667 32.1668Z" fill="#41D195"/>
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_699_1259">
                                                <rect width="72" height="72" fill="white" transform="translate(0.5)"/>
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </div>
                                <div className="font-semibold text-center text-lg">{lang['Transaction Sent !']}</div>
                                <div className="text-center text-sm">{lang['The transaction is sent and will be confirmed later']}</div>

                                <div className="my-4 p-3 bg-gray-100 rounded-lg">
                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang['To']}</div>
                                        <div className="font-semibold">{shortTransactionHash(formData.to)}</div>
                                    </div>
                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang['Time']}</div>
                                        <div className="font-semibold">{dayjs().format("YYYY-MM-DD HH:mm")}</div>
                                    </div>

                                    <div className="h-[1px] bg-gray-200 my-4" />

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang['Amount']}</div>
                                        {/* 使用 displayTokenSymbol */}
                                        <div className="font-semibold">{formData.amount} {displayTokenSymbol}</div>
                                    </div>

                                    <div className="h-[1px] bg-gray-200 my-4" />

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang['Tx Hash']}</div>
                                        <div className="font-semibold flex flex-row">
                                            <CopyText copyText={txHash || ''}>
                                                {txHash ? shortTransactionHash(txHash) : '--'}
                                            </CopyText>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex">
                                    <Button btntype={'secondary'}
                                            className={"mr-4 text-xs"}
                                            // 使用 chainMetadata
                                            disabled={!chainMetadata || !txHash}
                                            onClick={e => {
                                                // 使用 chainMetadata
                                                if (chainMetadata && txHash) {
                                                    const explorerUrl = chainMetadata.blockExplorerUrls[0]
                                                    window.open(`${explorerUrl}/tx/${txHash}`, '_blank')
                                                }
                                            }} >
                                        {lang['View on Explorer']}
                                    </Button>

                                    <Button btntype={'primary'}
                                            onClick={e => {setOpen(false)}} >
                                        {lang['Done']}
                                    </Button>
                                </div>
                            </>
                        }
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
