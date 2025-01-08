import {ReactNode, useContext, useState, useEffect} from "react"
import * as Dialog from "@radix-ui/react-dialog"
import Button from "@/components/Form/Button/Button"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import * as dayjsLib from "dayjs"
import useSporeCreate from "@/serves/useSporeCreate"
import {ccc, useCcc} from "@ckb-ccc/connector-react"
import {shortTransactionHash, toDisplay} from "@/utils/number_display"
import CopyText from "@/components/CopyText/CopyText"
import BigNumber from "bignumber.js"
import Select from "@/components/Select/Select"
import Input from "@/components/Form/Input/Input"
import {SporeDataView} from "@/utils/spore"
import {querySporesByAddress} from "@/utils/graphql"
import {Spores} from "@/utils/graphql/types"
import {ToastContext, ToastType} from "@/providers/ToastProvider/ToastProvider"

const dayjs: any = dayjsLib

// 常见 Content Type 列表
const COMMON_CONTENT_TYPES = ["application/json", "image/jpeg", "text/plain", "image/webp", "dob/0", "dob/1"]

interface DialogSporeCreateProps {
    children: ReactNode
    className?: string
}

export default function DialogSporeCreate({children, className}: DialogSporeCreateProps) {
    const {build, send} = useSporeCreate()
    const {network, config, addresses} = useContext(CKBContext)
    const {lang} = useContext(LangContext)
    const {showToast} = useContext(ToastContext)

    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<1 | 2>(1)
    const [feeRate, setFeeRate] = useState<1000 | 2000 | 3000>(1000)
    const [sending, setSending] = useState(false)
    const [txHash, setTxHash] = useState<null | string>(null)
    const [fee1000, setFee1000] = useState<string>("0")
    const [transactionError, setTransactionError] = useState<string>("")
    const {client} = useCcc()

    // Form fields
    const [contentType, setContentType] = useState<string>("")
    const [content, setContent] = useState<File | string | null>(null)
    const [clusterId, setClusterId] = useState<string>("none") // 默认值改为 "none"
    const [clusters, setClusters] = useState<Spores[]>([])

    // 自动检测文件类型
    const detectContentType = (file: File): string => {
        const extension = file.name.split(".").pop()?.toLowerCase()
        switch (extension) {
            case "json":
                return "application/json"
            case "jpg":
            case "jpeg":
                return "image/jpeg"
            case "txt":
                return "text/plain"
            case "webp":
                return "image/webp"
            default:
                return file.type || "application/octet-stream" // 默认类型
        }
    }

    // 处理文件上传或文本输入
    const handleContentChange = (value: File | string | null) => {
        setContent(value)
        if (value instanceof File) {
            const detectedType = detectContentType(value)
            setContentType(detectedType)
        } else if (typeof value === "string") {
            setContentType("text/plain") // 默认文本类型
        } else {
            setContentType("")
        }
    }

    // 重置表单状态
    const resetForm = () => {
        setStep(1)
        setContentType("")
        setContent(null)
        setClusterId("none")
        setFee1000("0")
        setTransactionError("")
        setTxHash(null)
    }

    // 打开弹窗时重置表单
    useEffect(() => {
        if (open) {
            resetForm()
        }
    }, [open])

    // Fetch clusters on open
    useEffect(() => {
        if (!open || !addresses || !addresses.length) return

        ;(async () => {
            try {
                const spores = await querySporesByAddress(addresses, 1, 10, undefined, network === "mainnet")
                setClusters(spores.filter((s: Spores) => s.cluster_id)) // Filter spores with cluster_id
            } catch (e) {
                console.error("Failed to fetch clusters:", e)
            }
        })()
    }, [open, addresses, network])

    // 计算并更新 fee
    const calculateFee = async (feeRate: number) => {
        try {
            if (!contentType || !content) {
                return
            }

            const contentBytes = await new Promise<ccc.BytesLike>((resolve, reject) => {
                if (content instanceof File) {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as ccc.BytesLike)
                    reader.onerror = () => reject(new Error("Failed to read file"))
                    reader.readAsArrayBuffer(content)
                } else if (typeof content === "string") {
                    resolve(new TextEncoder().encode(content))
                } else {
                    reject(new Error("Invalid content type"))
                }
            })

            const sporeData: SporeDataView = {
                contentType,
                content: contentBytes,
                clusterId: clusterId === "none" ? undefined : clusterId
            }

            const tx = await build({
                data: sporeData,
                feeRate
            })

            if (!!tx) {
                const inputCap = await tx.getInputsCapacity(client)
                const outCap = tx.getOutputsCapacity()
                const fee = inputCap - outCap
                const feeBigNumber = new BigNumber(fee.toString())
                const divisor = new BigNumber(10 ** 8)
                const fee1000BigNumber = feeBigNumber.dividedBy(divisor)
                setFee1000(fee1000BigNumber.toString())
            }
        } catch (e) {
            console.error("Error calculating fee:", e)
            setTransactionError("Failed to calculate fee. Please check your balance or reduce the file size.")
        }
    }

    // 当 content 或 feeRate 变化时重新计算 fee
    useEffect(() => {
        if (content && contentType) {
            calculateFee(feeRate)
        }
    }, [content, contentType, feeRate])

    const fee = (showFeeRate: number) => {
        return toDisplay(
            BigNumber(fee1000)
                .multipliedBy(showFeeRate / 1000)
                .toString(),
            0,
            true
        )
    }

    const handleSignAndSend = async () => {
        setSending(true)
        setTransactionError("")
        try {
            const contentBytes = await new Promise<ccc.BytesLike>((resolve, reject) => {
                if (content instanceof File) {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as ccc.BytesLike)
                    reader.onerror = () => reject(new Error("Failed to read file"))
                    reader.readAsArrayBuffer(content)
                } else if (typeof content === "string") {
                    resolve(new TextEncoder().encode(content))
                } else {
                    reject(new Error("Invalid content type"))
                }
            })

            const tx = await build({
                data: {
                    contentType,
                    content: contentBytes,
                    clusterId: clusterId === "none" ? undefined : clusterId
                },
                feeRate
            })

            const txHash = await send(tx)
            setTxHash(txHash)
            setStep(2)

            // 显示成功提示
            showToast("Spore created successfully!", ToastType.success)
        } catch (e: any) {
            console.error(e)
            setTransactionError(
                e.message || "Failed to create Spore. Please check your balance or reduce the file size."
            )
            showToast(e.message, ToastType.error)
        } finally {
            setSending(false)
        }
    }

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
                                    <div className="font-semibold text-2xl">{lang["Create Spore"]}</div>
                                    <div
                                        onClick={e => {
                                            setOpen(false)
                                        }}
                                        className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100"
                                    >
                                        <i className="uil-times text-gray-500" />
                                    </div>
                                </div>

                                {/* Content Input */}
                                <div className="mb-4">
                                    <div className="font-semibold mb-2">{lang["Content"]}</div>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            onChange={e => handleContentChange(e.target.files?.[0] || null)}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                        <div className="text-center text-gray-500">OR</div>
                                        <textarea
                                            value={typeof content === "string" ? content : ""}
                                            onChange={e => handleContentChange(e.target.value)}
                                            placeholder="Enter text content"
                                            className="w-full p-2 border rounded-lg"
                                            rows={4}
                                        />
                                    </div>
                                </div>

                                {/* Content Type Input */}
                                <div className="mb-4">
                                    <div className="font-semibold mb-2">{lang["Content Type"]}</div>
                                    <Input
                                        value={contentType}
                                        type="text"
                                        placeholder="e.g., image/png"
                                        onChange={e => setContentType(e.target.value)}
                                        list="content-types" // 关联 datalist
                                    />
                                    <datalist id="content-types">
                                        {COMMON_CONTENT_TYPES.map(type => (
                                            <option key={type} value={type} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Cluster ID Select */}
                                <div className="mb-4">
                                    <div className="font-semibold mb-2">{lang["Cluster ID"]}</div>
                                    <Select
                                        value={clusterId}
                                        onValueChange={value => setClusterId(value)}
                                        options={[
                                            {id: "none", label: "None"}, // 将空字符串改为 "none"
                                            ...clusters.map(cluster => ({
                                                id: cluster.cluster_id || "unknown", // 确保 cluster_id 不是空字符串
                                                label: cluster.cluster_id || "Unknown Cluster"
                                            }))
                                        ]}
                                    />
                                </div>

                                {/* Transaction Fee Select */}
                                <div className="mb-4">
                                    <div className="font-semibold mb-2">{lang["Transaction fee"]}</div>
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
                                    />
                                </div>

                                <div className="text-red-400 min-h-6 mb-2 break-words">{transactionError}</div>

                                <div className="mt-4">
                                    <Button btntype={"primary"} loading={sending} onClick={handleSignAndSend}>
                                        {lang["Create Spore"]}
                                    </Button>
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
                                        <div className="text-gray-500">{lang["Time"]}</div>
                                        <div className="font-semibold">{dayjs().format("YYYY-MM-DD HH:mm")}</div>
                                    </div>

                                    <div className="h-[1px] bg-gray-200 my-4" />

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
