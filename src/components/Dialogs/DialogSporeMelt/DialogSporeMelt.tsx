import {ReactNode, useContext, useEffect, useState} from "react"
import * as Dialog from "@radix-ui/react-dialog"
import Button from "@/components/Form/Button/Button"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import * as dayjsLib from "dayjs"
import useSporeMelt from "@/serves/useSporeMelt"
import {Spores} from "@/utils/graphql/types"
import {ccc, useCcc} from "@ckb-ccc/connector-react"
import {shortTransactionHash, toDisplay} from "@/utils/number_display"
import CopyText from "@/components/CopyText/CopyText"
import BigNumber from "bignumber.js"
import Select from "@/components/Select/Select"

const dayjs: any = dayjsLib

export default function DialogSporeMelt({
                                            children,
                                            spore,
                                            className,
                                            onComplete,
                                            cover
                                        }: {
    children: ReactNode
    spore: Spores
    className?: string
    cover?: string
    onComplete?: () => void
}) {
    const {build, send} = useSporeMelt()
    const {config} = useContext(CKBContext)
    const {lang} = useContext(LangContext)

    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<1 | 2>(1)
    const [feeRate, setFeeRate] = useState<1000 | 2000 | 3000>(1000)
    const [sending, setSending] = useState(false)
    const [txHash, setTxHash] = useState<null | string>(null)
    const [fee1000, setFee1000] = useState<string>("0")
    const [transactionError, setTransactionError] = useState<string>("")
    const {client} = useCcc()

    const fee = (showFeeRate: number) => {
        return toDisplay(
            BigNumber(fee1000)
                .multipliedBy(showFeeRate / 1000)
                .toString(),
            0,
            true
        )
    }

    const checkErrorsAndBuild = async (feeRate: number) => {
        setTransactionError("")
        try {
            const tx = await build({
                spore,
                feeRate
            })

            if (!!tx && feeRate === 1000) {
                try {
                    const inputCap = await tx.getInputsCapacity(client)
                    const outCap = tx.getOutputsCapacity()

                    console.log("Calculating fee...")
                    const fee = inputCap - outCap
                    console.log(`Fee calculated: ${fee}`)
                    const feeBigNumber = new BigNumber(fee.toString())
                    const divisor = new BigNumber(10 ** 8)
                    const fee1000BigNumber = feeBigNumber.dividedBy(divisor)

                    console.log("Setting fee1000...")
                    setFee1000(fee1000BigNumber.toString())
                } catch (e) {
                    console.error("Error calculating capacities or fee:", e)
                }
            } else {
                console.error("Failed to build transaction")
            }

            return tx
        } catch (e: any) {
            console.trace("Error in checkErrorsAndBuild:", e)
            setTransactionError(e.message || "An unexpected error occurred")
        } finally {
            console.log("Finished checkErrorsAndBuild")
        }
    }

    useEffect(() => {
        setStep(1)
        setFeeRate(1000)
        setTransactionError("")
        open &&
        (async () => {
            try {
                setSending(true)
                await checkErrorsAndBuild(1000)
            } finally {
                setSending(false)
            }
        })()
    }, [spore, open])

    const handleSignAndSend = async () => {
        setSending(true)
        setTransactionError("")
        try {
            const tx = await checkErrorsAndBuild(feeRate)
            if (!tx) {
                return
            }

            const txHash = await send(tx)
            setTxHash(txHash)
            setStep(2)
        } catch (e: any) {
            console.error(e)
            setTransactionError(e.message)
        } finally {
            setSending(false)
        }
    }

    console.log(spore)

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
                        {step === 1 && (
                            <>
                                <div className="flex flex-row justify-between items-center mb-4">
                                    <div className="font-semibold text-2xl">{lang["Melt Spore"]}</div>
                                    <div
                                        onClick={e => {
                                            setOpen(false)
                                        }}
                                        className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100"
                                    >
                                        <i className="uil-times text-gray-500"/>
                                    </div>
                                </div>


                                <img className="w-[100px] h-100px rounded-lg mx-auto my-5"
                                     src={cover || '/images/spore_placeholder.svg'} alt=""/>

                                <div
                                    className="mb-3 bg-amber-50 text-amber-500 text-xs px-2 py-1 rounded-lg flex flex-row items-center">
                                    <i className="uil-info-circle text-xl mr-2"/>
                                    {lang['Please NOTE: Asset melt is irreversible, so proceed with caution.']}
                                </div>

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

                                <div className="text-red-400 min-h-6 mb-2 break-words">{transactionError}</div>

                                <div className="mt-4"
                                     style={sending ? {opacity: '0.5', pointerEvents: 'none'} : undefined}>
                                    <MeltSporeAlert onConfig={() => {
                                        handleSignAndSend()
                                    }} className="w-full">
                                        <div
                                            className="cursor-pointer text-red-500 bg-neutral-100 font-semibold px-4 py-3 rounded-lg flex flex-row flex-nowrap justify-center hover:opacity-80">
                                            {lang["Melt Spore"]}
                                        </div>
                                    </MeltSporeAlert>
                                </div>
                            </>
                        )}

                        {step === 2 && (
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

                                    <div className="h-[1px] bg-gray-200 my-4"/>

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["Transaction fee"]}</div>
                                        <div className="font-semibold">{fee(feeRate)} CKB</div>
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
                                            if (onComplete) {
                                                onComplete()
                                            }
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

function MeltSporeAlert({children, onConfig, className}: {
    onConfig: () => void, children:ReactNode, className?: string
}) {
    const {lang} = useContext(LangContext)
    const [open, setOpen] = useState(false)

    return <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={className}>{children}</Dialog.Trigger>
        <Dialog.Portal>
            <Dialog.Content
                onPointerDownOutside={e => {
                    e.preventDefault()
                }}
                className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] p-4 max-w-[98vw] w-full md:max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none"
            >
                <div className="text-center">
                    <i className="uil-info-circle text-[60px] text-red-500"/>
                </div>
                <div className="my-2">
                    {lang['Melting the DOB will return CKB capacity, but there may be potential losses due to the floor price of the DOB. Are you sure you want to destroy it?']}
                </div>
                <div className="flex flex-row mt-4">
                    <Button btntype={"secondary"} onClick={() => setOpen(false)}>
                        {lang["Cancel"]}
                    </Button>
                    <Button btntype={"danger"} onClick={()=>{onConfig();setOpen(false)}} className="text-white ml-2">
                        {lang["Confirm"]}
                    </Button>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}
