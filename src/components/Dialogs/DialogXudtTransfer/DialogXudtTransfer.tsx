import React, {useContext, useEffect, useMemo} from "react"
import Input from "@/components/Form/Input/Input"
import * as Dialog from "@radix-ui/react-dialog"
import Button from "@/components/Form/Button/Button"
import useXudtBalance from "@/serves/useXudtBalance"
import {checksumCkbAddress, shortTransactionHash} from "@/utils/common"
import BigNumber from "bignumber.js"
import {toDisplay} from "@/utils/number_display"
import Select from "@/components/Select/Select"
import CopyText from "@/components/CopyText/CopyText"
import useXudtTransfer from "@/serves/useXudtTransfer"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {LangContext} from "@/providers/LangProvider/LangProvider"

import * as dayjsLib from "dayjs"
import {helpers} from "@ckb-lumos/lumos"
import {TokenInfoWithAddress} from "@/utils/graphql/types"
import {ccc, useCcc} from "@ckb-ccc/connector-react"

const dayjs: any = dayjsLib

export interface XudtTransferProps {
    form: string
    amount: string
    to: string
}

export default function DialogXudtTransfer({
    children,
    froms,
    className,
    token
}: {
    children: React.ReactNode
    froms: string[]
    token: TokenInfoWithAddress
    className?: string
}) {
    const {build, signAndSend} = useXudtTransfer()
    const {network, config} = useContext(CKBContext)
    const [open, setOpen] = React.useState(false)
    const {data: xudtBalance, status, refresh} = useXudtBalance(open ? froms : undefined, token)
    const {lang} = useContext(LangContext)

    const [formData, setFormData] = React.useState<XudtTransferProps>({
        form: "",
        amount: "",
        to: ""
    })

    const [step, setStep] = React.useState<1 | 2 | 3>(1)
    const [feeRate, setFeeRate] = React.useState<1000 | 2000 | 3000>(1000)
    const [sending, setSending] = React.useState(false)
    const [txHash, setTxHash] = React.useState<null | string>(null)
    const [tx, setTx] = React.useState<ccc.Transaction | null>(null)

    const fee = (feeRate: number) => {
        return toDisplay(
            BigNumber(fee1000)
                .multipliedBy(feeRate / 1000)
                .toString(),
            0,
            true
        )
    }

    //errors
    const [toError, setToError] = React.useState<string>("")
    const [amountError, setAmountError] = React.useState<string>("")
    const [transactionError, setTransactionError] = React.useState<string>("")

    const checkErrorsAndBuild = async () => {
        let hasError = false

        if (formData.to === "") {
            setToError("Please enter a valid address")
            hasError = true
        } else if (!checksumCkbAddress(formData.to, network)) {
            setToError("Invalid CKB address")
            hasError = true
        } else {
            setToError("")
        }

        if (formData.amount === "") {
            setAmountError("Please enter a valid amount")
            hasError = true
        } else if (
            BigNumber(formData.amount)
                .multipliedBy(10 ** token.decimal)
                .gt(xudtBalance ? xudtBalance.amount : 0)
        ) {
            setAmountError("Insufficient balance")
            hasError = true
        } else if (BigNumber(formData.amount).eq(0)) {
            setAmountError("Please enter a valid amount")
            hasError = true
        } else {
            setAmountError("")
        }

        const amount = BigNumber(formData.amount).multipliedBy(10 ** token.decimal)
        let tx: ccc.Transaction | null = null
        if (!hasError) {
            try {
                tx = await build({
                    froms,
                    to: formData.to,
                    amount: amount.toString(),
                    feeRate: 1000,
                    tokenInfo: token
                })
                setTx(tx)
                setAmountError("")
            } catch (e: any) {
                console.error(e)
                hasError = true
                setAmountError(e.message)
            }
        }

        return !hasError ? tx : null
    }

    const setMaxAmount = () => {
        setFormData({
            ...formData,
            amount: xudtBalance
                ? BigNumber(xudtBalance.amount)
                      .dividedBy(10 ** token.decimal)
                      .toString()
                : "0"
        })
    }
    const {client} = useCcc()
    const [fee1000, setFee1000] = React.useState("0")

    useEffect(() => {
        const calculateFee = async () => {
            console.log("Starting fee calculation...")
            if (!tx) {
                console.log("Transaction (tx) is null or undefined. Exiting fee calculation.")
                return
            }
            console.log("Fetching input capacity...")
            const inputCap = await tx.getInputsCapacity(client)
            console.log(`Input capacity fetched: ${inputCap}`)

            console.log("Fetching output capacity...")
            const outCap = tx.getOutputsCapacity()
            console.log(`Output capacity fetched: ${outCap}`)

            console.log("Calculating fee...")
            const fee = inputCap - outCap
            console.log(`Fee calculated: ${fee}`)
            const feeBigNumber = new BigNumber(fee.toString())
            const divisor = new BigNumber(10 ** 8)
            const fee1000BigNumber = feeBigNumber.dividedBy(divisor)

            console.log("Setting fee1000...")
            setFee1000(fee1000BigNumber.toString())
            console.log(`Fee1000 set to: ${fee1000BigNumber.toString()}`)
        }

        calculateFee()
    }, [tx, client, feeRate, token.decimal])
    // const fee1000 = useMemo(async () => {
    //     if (!tx) return "0"
    //     const inputCap = await tx.getInputsCapacity(client)
    //     const outCap = tx.getOutputsCapacity()
    //     const fee = inputCap - outCap
    //     return (fee / BigInt(10 ** 8)).toString()
    // }, [tx, feeRate, token.decimal])

    const handleTransfer = async () => {
        setSending(true)
        try {
            const tx = await checkErrorsAndBuild()
            if (!!tx) {
                setTx(tx)
                setStep(2)
            }
        } catch (e: any) {
            console.error(e)
        } finally {
            setSending(false)
        }
    }

    const HandleSignAndSend = async () => {
        setSending(true)
        setTransactionError("")
        try {
            const amount = BigNumber(BigNumber(formData.amount)).multipliedBy(10 ** token.decimal)
            const txHash = await signAndSend({
                froms,
                to: formData.to,
                amount: amount.toString(),
                feeRate,
                tokenInfo: token
            })
            console.log(txHash, txHash)
            setTxHash(txHash)
            setStep(3)
        } catch (e: any) {
            console.error(e)
            setTransactionError(e.message)
        } finally {
            setSending(false)
        }
    }

    useEffect(() => {
        setStep(1)
        open && refresh()
    }, [open])

    useEffect(() => {
        setAmountError("")
        setToError("")
        setTransactionError("")
    }, [step])

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className={className}>{children}</Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0" />
                <Dialog.Content
                    onPointerDownOutside={e => {
                        e.preventDefault()
                    }}
                    className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] p-4 max-w-[98vw] w-full md:max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
                >
                    <div className="h-full overflow-auto max-h-[88vh] w-full">
                        {step === 1 && (
                            <>
                                <div className="flex flex-row justify-between items-center mb-4">
                                    <div className="font-semibold text-2xl">{lang["Transfer"]}</div>
                                    <div
                                        onClick={e => {
                                            setOpen(false)
                                        }}
                                        className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100"
                                    >
                                        <i className="uil-times text-gray-500" />
                                    </div>
                                </div>

                                <div className="font-semibold mb-10">
                                    <div className="mb-2">Send to</div>
                                    <Input
                                        value={formData.to}
                                        placeholder={lang["Recipient address"]}
                                        type={"text"}
                                        onChange={e => {
                                            setFormData({...formData, to: e.target.value})
                                        }}
                                    />
                                    <div className="font-normal text-red-400 mt-1 break-words">{toError}</div>
                                </div>

                                <div className="font-semibold mb-10">
                                    <div className="mb-2">{lang["Asset"]}</div>
                                    <Input
                                        startIcon={<TokenIcon size={32} symbol={token.symbol} />}
                                        value={token.symbol}
                                        type={"text"}
                                        disabled
                                    />
                                </div>

                                <div className="font-semibold mb-10">
                                    <div className="mb-2 flex-row flex items-center justify-between">
                                        <div>{lang["Amount"]}</div>
                                        <div className="font-normal">
                                            <span className="text-gray-500"> {lang["Balance"]}:</span>{" "}
                                            {xudtBalance ? toDisplay(xudtBalance.amount, token.decimal, true) : "--"}
                                        </div>
                                    </div>
                                    <Input
                                        value={formData.amount}
                                        type={"number"}
                                        placeholder={lang["Transfer amount"]}
                                        onChange={e => {
                                            setFormData({...formData, amount: e.target.value})
                                        }}
                                        endIcon={
                                            <div className="cursor-pointer text-[#6CD7B2]" onClick={setMaxAmount}>
                                                Max
                                            </div>
                                        }
                                    />
                                    <div className="font-normal text-red-400 mt-1 break-words">{amountError}</div>
                                </div>

                                <Button
                                    btntype={"primary"}
                                    loading={status === "loading" || sending}
                                    onClick={handleTransfer}
                                >
                                    {lang["Continue"]}
                                </Button>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="flex flex-row justify-between items-center mb-4">
                                    <div className="font-semibold text-2xl">{lang["Sign Transaction"]}</div>
                                    <div
                                        onClick={e => {
                                            setOpen(false)
                                        }}
                                        className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100"
                                    >
                                        <i className="uil-times text-gray-500" />
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <div className="mb-2 font-semibold">{lang["Send Token"]}</div>
                                    <div className="flex flex-row flex-nowrap justify-between items-center mb-2 text-sm">
                                        <div className="flex flex-row flex-nowrap items-center">
                                            <TokenIcon size={18} symbol={token.symbol} />
                                            {token.symbol}
                                        </div>
                                        <div>
                                            {formData.amount} {token.symbol}
                                        </div>
                                    </div>

                                    <div className="flex flex-row flex-nowrap justify-between items-center text-sm">
                                        <div className="flex flex-row flex-nowrap items-center">
                                            {lang["To Address"]}
                                        </div>
                                        <div>{shortTransactionHash(formData.to)}</div>
                                    </div>

                                    <div className="my-4 h-[1px] bg-gray-100 w-full" />

                                    <div className="mb-2 font-semibold">{lang["Transaction fee"]}</div>
                                    <Select
                                        className={"bg-gray-100 py-2 px-4 rounded-lg text-sm"}
                                        defaultValue={"1000"}
                                        value={feeRate + ""}
                                        options={[
                                            {id: "1000", label: `${fee(1000)} CKB (Slow: 1000 shannons/KB)`},
                                            {id: "2000", label: `${fee(2000)} CKB (Standard: 2000 shannons/KB)`},
                                            {id: "3000", label: `${fee(3000)} CKB (Fast: 3000 shannons/KB)`}
                                        ]}
                                        onValueChange={value => {
                                            setFeeRate(Number(value) as 1000 | 2000 | 3000)
                                        }}
                                    ></Select>
                                </div>

                                <div className="text-red-400 min-h-6 mb-2 break-words">{transactionError}</div>

                                <div className="flex flex-row">
                                    <Button
                                        btntype={"secondary"}
                                        className="mr-4"
                                        loading={status === "loading"}
                                        onClick={e => {
                                            setStep(1)
                                        }}
                                    >
                                        {lang["Cancel"]}
                                    </Button>
                                    <Button btntype={"primary"} loading={sending} onClick={HandleSignAndSend}>
                                        {lang["Transfer"]}
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <div className="flex flex-row justify-center items-center mb-4 mt-2">
                                    <svg
                                        width="73"
                                        height="72"
                                        viewBox="0 0 73 72"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <g clipPath="url(#clip0_699_1259)">
                                            <circle cx="36.5" cy="36" r="36" fill="#41D195" fillOpacity="0.12" />
                                            <path
                                                d="M37 19.3335C27.8167 19.3335 20.3333 26.8168 20.3333 36.0002C20.3333 45.1835 27.8167 52.6668 37 52.6668C46.1833 52.6668 53.6667 45.1835 53.6667 36.0002C53.6667 26.8168 46.1833 19.3335 37 19.3335ZM44.9667 32.1668L35.5167 41.6168C35.2833 41.8502 34.9667 41.9835 34.6333 41.9835C34.3 41.9835 33.9833 41.8502 33.75 41.6168L29.0333 36.9002C28.55 36.4168 28.55 35.6168 29.0333 35.1335C29.5167 34.6502 30.3167 34.6502 30.8 35.1335L34.6333 38.9668L43.2 30.4002C43.6833 29.9168 44.4833 29.9168 44.9667 30.4002C45.45 30.8835 45.45 31.6668 44.9667 32.1668Z"
                                                fill="#41D195"
                                            />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_699_1259">
                                                <rect width="72" height="72" fill="white" transform="translate(0.5)" />
                                            </clipPath>
                                        </defs>
                                    </svg>
                                </div>
                                <div className="font-semibold text-center text-lg">{lang["Transaction Sent !"]}</div>
                                <div className="text-center text-sm">
                                    {lang["The transaction is sent and will be confirmed later"]}
                                </div>

                                <div className="my-4 p-3 bg-gray-100 rounded-lg">
                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["To"]}</div>
                                        <div className="font-semibold">{shortTransactionHash(formData.to)}</div>
                                    </div>
                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["Time"]}</div>
                                        <div className="font-semibold">{dayjs().format("YYYY-MM-DD HH:mm")}</div>
                                    </div>

                                    <div className="h-[1px] bg-gray-200 my-4" />

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["Amount"]}</div>
                                        <div className="font-semibold">
                                            {formData.amount} {token.symbol}
                                        </div>
                                    </div>

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["Transaction fee"]}</div>
                                        <div className="font-semibold">{fee(feeRate)} CKB</div>
                                    </div>

                                    <div className="h-[1px] bg-gray-200 my-4" />

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["Tx Hash"]}</div>
                                        <div className="font-semibold flex flex-row">
                                            <CopyText copyText={txHash || ""}>
                                                {txHash ? shortTransactionHash(txHash) : "--"}
                                            </CopyText>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex">
                                    <Button
                                        btntype={"secondary"}
                                        className={"mr-4 text-xs"}
                                        loading={sending}
                                        onClick={e => {
                                            window.open(`${config.explorer}/transaction/${txHash}`, "_blank")
                                        }}
                                    >
                                        {lang["View on Explorer"]}
                                    </Button>

                                    <Button
                                        btntype={"primary"}
                                        loading={sending}
                                        onClick={e => {
                                            setOpen(false)
                                        }}
                                    >
                                        {lang["Done"]}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
