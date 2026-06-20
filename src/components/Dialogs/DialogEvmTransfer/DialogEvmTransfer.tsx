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
import useEvmNetwork from "@/serves/useEvmNetwork"
import TokenIcon from "@/components/TokenIcon/TokenIcon"

import * as dayjsLib from "dayjs"
const dayjs: any = dayjsLib


export default function DialogEvmTransfer({children, className, network}: { children: React.ReactNode, className?: string, network: string}) {
    const {transfer} = useEvmTokenTransfer()
    const {lang} = useContext(LangContext)
    const {internalAddress} = useContext(CKBContext)
    const SupportedEvmChainMetadata = useEvmNetwork()
    
    const [open, setOpen] = React.useState(false);
    const [formData, setFormData] = React.useState({
        network: network === 'matic-mainnet' ? 'polygon-mainnet' : network,
        amount: "",
        to: "",
    });

    const [balance, setBalance] = React.useState<string>('0')
    const [step, setStep] = React.useState<1 | 2 | 3>(1)
    const [sending, setSending] = React.useState(false)
    const [txHash, setTxHash] = React.useState<null | string>(null)
    const [loadingBalance, setLoadingBalance] = React.useState(false)

    //errors
    const [toError, setToError] = React.useState<string>('')
    const [amountError, setAmountError] = React.useState<string>('')
    const [transactionError, setTransactionError] = React.useState<string>('')

    const getBalance = async () => {
        if (!formData.network) return
        setLoadingBalance(true)
        try {
            const res = await fetch(`${process.env.REACT_APP_MARKET_API}/api/evm/balance`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: internalAddress,
                    networks: [formData.network]
                })
            })
            const data = await res.json()
            const target = data[0]
            setBalance(target?.amount || '0')
        } catch (error) {
            console.error("getBalance error", error)
        } finally {
            setLoadingBalance(false)
        }
    }

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

        if (formData.amount === '') {
            setAmountError('请输入有效金额')
            hasError = true
        } else if (BigNumber(formData.amount).lte(0)) {
            setAmountError('请输入大于0的金额')
            hasError = true
        } else if (BigNumber(formData.amount).gt(balance)) {
            setAmountError('余额不足')
            hasError = true
        } else {
            setAmountError('')
            setFormData({...formData, amount: Number(formData.amount).toString()})
        }

        if (formData.network === '') {
            setAmountError('请选择网络')
            hasError = true
        }

        return !hasError
    }

    const setMaxAmount = () => {
        setFormData({
            ...formData,
            amount: balance ? BigNumber(balance).dividedBy(10 ** 18).toString() : '0'
        })
    }

    const handleTransfer = async () => {
        setSending(true)
        const isValid = await checkErrorsAndBuild()
        if (isValid) {
            setStep(2)
        }
        setSending(false)
    }

    const HandleSignAndSend = async () => {
        setSending(true)
        setTransactionError('')
        try {
            const txHash = await transfer({
                to: formData.to,
                amount: formData.amount,
                network: formData.network
            })
            console.log(txHash)
            setTxHash(txHash)
            setStep(3)
        } catch (e:any) {
            console.error(e)
            setTransactionError(e.message)
        } finally {
            setSending(false)
        }
    }

    useEffect(() => {
        setStep(1)
        if (open && internalAddress) {
            getBalance()
        }

        if (!open) {
            setAmountError('')
            setToError('')
            setTransactionError('')
        }
    }, [open, network, internalAddress])

    useEffect(() => {
        setAmountError('')
        setToError('')
        setTransactionError('')
    }, [step])

    const metadata = SupportedEvmChainMetadata.find(m => m.chain === formData.network)

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
                                    <div className="font-semibold text-2xl">{lang['Transfer']}</div>
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
                                        <div className="font-normal"><span
                                            className="text-gray-500"> {lang['Balance']}: </span> {loadingBalance ?
                                                <div className="loading-bg h-[20px] w-[100px] rounded inline-block"/> :
                                                toDisplay(balance || '0', 18, true)} {metadata?.tokenSymbol}
                                        </div>
                                    </div>
                                    <Input value={formData.amount}
                                           type={"text"}
                                           placeholder={lang['Transfer amount']}
                                           onChange={e => {
                                            let value = e.target.value
                                            value = value.replace(/[^0-9.]/g, '')
                                            // 防止连续的小数点
                                            value = value.replace(/\.{2,}/g, '.')
                                            // 只允许一个小数点，如果有多个小数点，只保留第一个
                                            const parts = value.split('.')
                                            if (parts.length > 2) {
                                                value = parts[0] + '.' + parts.slice(1).join('')
                                            }
                                            if (value.startsWith('.')) {
                                                value = '0' + value
                                            }
                                               setFormData({...formData, amount: value})
                                           }}
                                           endIcon={<div className="cursor-pointer text-[#6CD7B2]"
                                                         onClick={setMaxAmount}>Max</div>}
                                    />
                                    <div className="font-normal text-red-400 mt-1">{amountError}</div>
                                </div>

                                <Button btntype={'primary'}
                                        loading={loadingBalance || sending}
                                        disabled={loadingBalance || sending || !formData.to || !formData.amount}
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
                                            <TokenIcon symbol={metadata?.tokenSymbol || ''} size={18} chain={metadata?.chain} />
                                            {metadata?.tokenSymbol}
                                        </div>
                                        <div className="font-semibold">{formData.amount} {metadata?.tokenSymbol}</div>
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
                                        {metadata && ChainIcons[metadata.chain] && 
                                            <img src={ChainIcons[metadata.chain]} width={18} height={18} className="mr-2" alt=""/>
                                        }
                                        {metadata?.name}
                                    </div>
                                </div>

                                <div className="text-red-400 min-h-6 mb-2">{transactionError}</div>

                                <div className="flex flex-row">
                                    <Button btntype={'secondary'}
                                            className="mr-4"
                                            loading={loadingBalance}
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
                                        <div className="font-semibold">{formData.amount} {metadata?.tokenSymbol}</div>
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
                                            loading={sending}
                                            onClick={e => {
                                                if (metadata) {
                                                    const explorerUrl = metadata.blockExplorerUrls[0]
                                                    window.open(`${explorerUrl}/tx/${txHash}`, '_blank')
                                                }
                                            }} >
                                        {lang['View on Explorer']}
                                    </Button>

                                    <Button btntype={'primary'}
                                            loading={sending}
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
