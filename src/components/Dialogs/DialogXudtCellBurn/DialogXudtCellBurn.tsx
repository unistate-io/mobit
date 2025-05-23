import React, {ReactNode, useContext, useEffect, useMemo, useState} from "react"
import {TokenInfoWithAddress} from "@/utils/graphql/types"
import * as Dialog from "@radix-ui/react-dialog"
import useGetXudtCell from "@/serves/useGetXudtCell"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import {toDisplay} from "@/utils/number_display"
import {number} from "@ckb-lumos/codec"
import Button from "@/components/Form/Button/Button"
import {shortTransactionHash} from "@/utils/common"
import CopyText from "@/components/CopyText/CopyText"
import dayjs from "dayjs"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import Input from "@/components/Form/Input/Input"
import {leToU128} from "@rgbpp-sdk/ckb"
import {ccc, useCcc} from "@ckb-ccc/connector-react"
import BigNumber from "bignumber.js"

export interface DialogXudtCellMergeProps {
    children: ReactNode
    addresses?: string[]
    xudt?: TokenInfoWithAddress
    className?: string
    onOpenChange?: (open: boolean) => any
}

export default function DialogXudtCellBurn({
                                               children,
                                               addresses,
                                               xudt,
                                               className = "",
                                               onOpenChange
                                           }: DialogXudtCellMergeProps) {
    const {config} = useContext(CKBContext)
    const {lang} = useContext(LangContext)

    const [step, setStep] = useState(1)
    const [open, setOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [rawTx, setRawTx] = useState<ccc.Transaction | null>(null)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [txError, setTxError] = useState<string>("")
    const [amount, setAmount] = useState<string>("0")
    const [amountError, setAmountError] = useState<string>("")

    const {data, status, createBurnXudtCellTx, signAndSend} = useGetXudtCell(xudt, open ? addresses : undefined)

    const balance = useMemo(() => {
        const total = data.reduce((sum, input) => sum + leToU128(input.data), BigInt(0))
        return total.toString()
    }, [data, xudt?.decimal])

    useEffect(() => {
        setStep(1)
        setTxError("")
        setAmountError("")
        !!onOpenChange && onOpenChange(open)
    }, [open])

    const nextStep = () => {
        setAmountError("")
        if (!amount || Number(amount) === 0) {
            setAmountError("Please input amount")
            return
        }

        if (Number(balance) * 10 ** xudt!.decimal < Number(amount)) {
            setAmountError("Insufficient balance")
            return
        }

        ;(async () => {
            setSending(true)
            try {
                const tx = await createBurnXudtCellTx(BigInt(amount), 1000)
                console.log("tx: ", tx)
                setRawTx(tx)
                setStep(2)
            } catch (e: any) {
                setTxError(e.message || "Failed to create transaction")
            } finally {
                setSending(false)
            }
        })()
    }

    const handleSignAndSend = async () => {
        setSending(true)
        setTxError("")
        try {
            const txHash = await signAndSend(rawTx!)
            setTxHash(txHash)
            setStep(3)
        } catch (e: any) {
            console.error(e)
            setTxError(e.message || "Failed to send transaction")
        } finally {
            setSending(false)
        }
    }

    // const fee = useMemo(() => {
    //     if (!rawTx) return "0"

    //     try {
    //         const inputCap = rawTx.inputs.reduce((sum, input) => sum + Number(input.cellOutput.capacity), 0)
    //         const outCap = rawTx.outputs.reduce((sum, input: any) => sum + Number(input.capacity), 0)
    //         return (inputCap - outCap) / 10 ** 8 + ""
    //     } catch (e) {
    //         console.error(e)
    //         return "0"
    //     }
    // }, [rawTx, xudt])
    const [fee, setFee1000] = useState("0")
    const {client} = useCcc()
    useEffect(() => {
        const calculateFee = async () => {
            if (!rawTx) return
            const inputCap = await rawTx.getInputsCapacity(client)
            const outCap = rawTx.getOutputsCapacity()
            const fee = inputCap - outCap
            const feeBigNumber = new BigNumber(fee.toString())
            const divisor = new BigNumber(10 ** 8)
            const fee1000BigNumber = feeBigNumber.dividedBy(divisor)

            console.log("Setting fee1000...")
            setFee1000(fee1000BigNumber.toString())
            console.log(`Fee1000 set to: ${fee1000BigNumber.toString()}`)
        }

        calculateFee()
    }, [rawTx, xudt])

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className={className}>{children}</Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0"/>
                <Dialog.Content
                    onPointerDownOutside={e => {
                        e.preventDefault()
                    }}
                    className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] p-4 max-w-[98vw] w-full md:max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
                >
                    <div className="h-full overflow-auto max-h-[88vh] w-full">
                        <div className="flex flex-row justify-between items-center mb-1">
                            <div className="font-semibold text-2xl">{lang["Burn UDT"]}</div>
                            <div
                                onClick={e => {
                                    setOpen(false)
                                }}
                                className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100"
                            >
                                <i className="uil-times text-gray-500"/>
                            </div>
                        </div>
                        <div
                            className="text-sm mb-5">{lang['Burn UTXO Cells to save space and get CKB returned']}</div>

                        {step === 1 && (
                            <div>
                                <div className="font-semibold mb-1">
                                    {lang["Input"]} {lang["Amount"]}
                                </div>
                                <Input
                                    value={Number(amount) / 10 ** xudt!.decimal}
                                    type={"number"}
                                    onChange={e => {
                                        setAmount((Number(e.target.value) * 10 ** xudt!.decimal).toString())
                                    }}
                                    endIcon={
                                        <div
                                            className="cursor-pointer text-[#6CD7B2]"
                                            onClick={e => {
                                                if (status === "complete") {
                                                    console.log(Number(balance), xudt!.decimal)
                                                    setAmount(balance)
                                                }
                                            }}
                                        >
                                            Max
                                        </div>
                                    }
                                />

                                <div className="mt-4">
                                    {lang["Balance"]}:{" "}
                                    {status === "complete" ? toDisplay(balance, xudt?.decimal || 0, true) : "--"}{" "}
                                    {xudt?.symbol}
                                </div>
                                <div className="text-red-400 min-h-6 break-words mt-1 mb-2">{amountError}</div>
                                <div className="flex flex-row mt-4">
                                    <Button
                                        btntype={"secondary"}
                                        className="mr-4"
                                        onClick={e => {
                                            setOpen(false)
                                        }}
                                    >
                                        {lang["Cancel"]}
                                    </Button>
                                    <Button
                                        btntype={"primary"}
                                        loading={status === "loading" || sending}
                                        onClick={nextStep}
                                    >
                                        {lang["Next"]}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <>
                                <div className="font-semibold mb-1">{lang["Input"]} Cells</div>
                                {status === "loading" && (
                                    <div
                                        className="flex flex-row w-full flex-wrap mb-4 child h-[104px] [&>*:nth-child(2n)]:mr-0">
                                        <div
                                            className="loading-bg h-24 my-1 grow-0 rounded w-[calc(50%-4px)] my-1 border mr-2"/>
                                        <div
                                            className="loading-bg h-24 my-1 grow-0 rounded w-[calc(50%-4px)] my-1 border mr-2"/>
                                    </div>
                                )}

                                {status === "complete" && (
                                    <div
                                        className="flex flex-row w-full flex-wrap mb-4 max-h-[208px] overflow-auto [&>*:nth-child(2n)]:mr-0">
                                        {!!rawTx ? (
                                            rawTx.inputs.map((cell, index) => {
                                                return (
                                                    <div key={index}
                                                         className="h-24 grow-0 rounded w-[calc(50%-4px)] my-1 border mr-2 overflow-hidden">
                                                        <div
                                                            className="flex flex-row items-center bg-gray-50 p-2 text-xs overflow-hidden">
                                                            {toDisplay(Number(cell.cellOutput?.capacity).toString(), 8, true)} CKB
                                                        </div>
                                                        {!cell.cellOutput?.type && (
                                                            <div className="flex flex-row items-center p-2">
                                                                <TokenIcon size={28} symbol={'ckb'}/>
                                                                <div className="text-sm">
                                                                    <div>{'CKB'}</div>
                                                                    <div className="font-semibold">
                                                                        {toDisplay(
                                                                            Number(cell.cellOutput!.capacity).toString(),
                                                                            8,
                                                                            true
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {!!cell.cellOutput?.type && (
                                                            <div className="flex flex-row items-center p-2">
                                                                <TokenIcon size={28} symbol={xudt?.symbol || ""}/>
                                                                <div className="text-sm">
                                                                    <div>{xudt?.symbol}</div>
                                                                    <div className="font-semibold">
                                                                        {toDisplay(
                                                                            number.Uint128LE.unpack(
                                                                                (cell as any).outputData
                                                                            ).toString(),
                                                                            xudt?.decimal || 0,
                                                                            true
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div
                                                className="h-[104px] flex items-center justify-center flex-row w-full bg-gray-50 rounded text-gray-300">
                                                Not Data
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="font-semibold mb-1">{lang["Output"]} Cells</div>

                                {status === "loading" && (
                                    <div className="flex flex-row w-full flex-wrap h-[104px] [&>*:nth-child(2n)]:mr-0">
                                        <div
                                            className="loading-bg my-1 h-24 grow-0 rounded w-[calc(50%-4px)] my-1 border mr-2"/>
                                        <div
                                            className="loading-bg my-1 h-24 grow-0 rounded w-[calc(50%-4px)] my-1 border mr-2"/>
                                    </div>
                                )}

                                {status !== "loading" && (
                                    <div
                                        className="flex flex-row w-full flex-wrap h-[104px] overflow-auto [&>*:nth-child(2n)]:mr-0">
                                        {!!rawTx ? (
                                            rawTx.outputs.map((cellOutput: any, index) => {
                                                return (
                                                    <div key={index}
                                                         className="h-24 grow-0 rounded w-[calc(50%-4px)] my-1 border mr-2 overflow-hidden">
                                                        <div
                                                            className="flex flex-row items-center bg-gray-50 p-2 text-xs overflow-hidden">
                                                            {toDisplay(
                                                                Number(cellOutput.capacity).toString(),
                                                                8,
                                                                true
                                                            )} CKB
                                                        </div>
                                                        {!!cellOutput.type && (
                                                            <div className="flex flex-row items-center p-2">
                                                                <TokenIcon size={28} symbol={xudt?.symbol || ""}/>
                                                                <div className="text-sm">
                                                                    <div>{xudt?.symbol}</div>
                                                                    <div className="font-semibold">
                                                                        {toDisplay(
                                                                            number.Uint128LE.unpack(
                                                                                (rawTx! as any).outputsData[index]
                                                                            ).toString(),
                                                                            xudt?.decimal || 0,
                                                                            true
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!cellOutput.type && (
                                                            <div className="flex flex-row items-center p-2">
                                                                <TokenIcon size={28} symbol="CKB"/>
                                                                <div className="text-sm">
                                                                    <div>CKB</div>
                                                                    <div className="font-semibold">
                                                                        {toDisplay(
                                                                            cellOutput.capacity.toString(),
                                                                            8,
                                                                            true
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div
                                                className="h-[104px] flex items-center justify-center flex-row w-full bg-gray-50 rounded text-gray-300">
                                                Not Data
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="min-h-6 mt-4 mb-2 font-semibold">
                                    Fee: <span className="font-normal">{fee}</span> CKB
                                </div>
                                <div className="text-red-400 min-h-6 break-words mt-1 mb-2">{txError}</div>
                                <div className="flex flex-row mt-4">
                                    <Button
                                        btntype={"secondary"}
                                        className="mr-4"
                                        onClick={e => {
                                            setStep(1)
                                        }}
                                    >
                                        {lang["Cancel"]}
                                    </Button>
                                    <Button
                                        btntype={"primary"}
                                        loading={sending || status === "loading"}
                                        onClick={handleSignAndSend}
                                    >
                                        {lang["Burn"]}
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
                                            <circle cx="36.5" cy="36" r="36" fill="#41D195" fillOpacity="0.12"/>
                                            <path
                                                d="M37 19.3335C27.8167 19.3335 20.3333 26.8168 20.3333 36.0002C20.3333 45.1835 27.8167 52.6668 37 52.6668C46.1833 52.6668 53.6667 45.1835 53.6667 36.0002C53.6667 26.8168 46.1833 19.3335 37 19.3335ZM44.9667 32.1668L35.5167 41.6168C35.2833 41.8502 34.9667 41.9835 34.6333 41.9835C34.3 41.9835 33.9833 41.8502 33.75 41.6168L29.0333 36.9002C28.55 36.4168 28.55 35.6168 29.0333 35.1335C29.5167 34.6502 30.3167 34.6502 30.8 35.1335L34.6333 38.9668L43.2 30.4002C43.6833 29.9168 44.4833 29.9168 44.9667 30.4002C45.45 30.8835 45.45 31.6668 44.9667 32.1668Z"
                                                fill="#41D195"
                                            />
                                        </g>
                                        <defs>
                                            <clipPath id="clip0_699_1259">
                                                <rect width="72" height="72" fill="white" transform="translate(0.5)"/>
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
                                        <div className="text-gray-500">{lang["Time"]}</div>
                                        <div className="font-semibold">{dayjs().format("YYYY-MM-DD HH:mm")}</div>
                                    </div>

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["Transaction fee"]}</div>
                                        <div className="font-semibold">{fee} CKB</div>
                                    </div>

                                    <div className="h-[1px] bg-gray-200 my-4"/>

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
