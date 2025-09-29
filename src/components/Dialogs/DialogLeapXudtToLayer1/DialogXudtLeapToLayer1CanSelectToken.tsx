import React, {ReactNode, useContext, useEffect, useMemo, useState} from "react"
import * as Dialog from "@radix-ui/react-dialog"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import {TokenBalance} from "@/components/ListToken/ListToken"
import useLeapXudtToLayer1, {BtcUtxo} from "@/serves/useLeapXudtToLayer1"
import {toDisplay} from "@/utils/number_display"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import {isBtcAddress, shortTransactionHash} from "@/utils/common"
import Button from "@/components/Form/Button/Button"
import Input from "@/components/Form/Input/Input"
import BigNumber from "bignumber.js"
import ProfileAddresses from "@/components/ProfileAddresses/ProfileAddresses"
import dayjs from "dayjs"
import CopyText from "@/components/CopyText/CopyText"
import Select from "@/components/Select/Select"
import useBtcWallet from "@/serves/useBtcWallet"
import {ccc, useCcc} from "@ckb-ccc/connector-react"
import useAllXudtBalance from "@/serves/useAllXudtBalance"
import {tokenInfoToScript} from "@/utils/graphql/types"

export default function DialogXudtLeapToLayer1CanSelectToken({
    children,
    className
}: {
    children: ReactNode
    className?: string
}) {
    const {address, addresses, internalAddress, config, network, wallet} = useContext(CKBContext)
    const {lang} = useContext(LangContext)
    const {isBtcWallet, createUTXO, feeRate} = useBtcWallet()
    const {getUTXO, buildLeapTx, leap} = useLeapXudtToLayer1()

    const [step, setStep] = useState(1)
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [utxos, setUtxos] = useState<BtcUtxo[]>([])
    const [selectedUtxo, setSelectedUtxo] = useState<BtcUtxo | null>(null)
    const [toBtcAddress, setToBtcAddress] = useState(internalAddress || "")
    const [leapAmount, setLeapAmount] = useState("")
    const [txHash, setTxHash] = useState("")
    const [tx, setTx] = useState<null | ccc.Transaction>(null)
    const [btcFeeRate, setBtcFeeRate] = useState(feeRate)

    const [amountError, setAmountError] = useState("")
    const [toAddressError, setToAddressError] = useState("")
    const [txError, setTxError] = useState("")
    const [tokenError, setTokenError] = useState("")
    const [buildError, setBuildError] = useState("")

    const {data: xudtBalance, status: xudtBalenceStatus} = useAllXudtBalance(addresses || [])
    const [token, setToken] = useState<undefined | TokenBalance>(undefined)

    useEffect(() => {
        ;(async () => {
            if (step !== 2 || !isBtcWallet || !toBtcAddress) {
                setUtxos([])
                return
            }

            setBusy(true)
            try {
                const utxos = await getUTXO({btcAddress: toBtcAddress})
                setUtxos(utxos)
            } finally {
                setBusy(false)
            }
        })()
    }, [toBtcAddress, isBtcWallet, step])

    useEffect(() => {
        if (open) {
            setStep(1)
            setToBtcAddress(internalAddress || "")
            setLeapAmount("")
            setAmountError("")
            setToAddressError("")
            setTxError("")
            setSelectedUtxo(null)
        }
    }, [internalAddress, open])

    const setMaxAmount = () => {
        if (xudtBalenceStatus === "complete" && !!token) {
            setLeapAmount(BigNumber(token.amount).div(10 ** token.decimal).toString())
        }
    }

    const handleStep3 = async () => {
        try {
            setBusy(true)
            const tokenScript = tokenInfoToScript(token!)
            if (!tokenScript) {
                throw new Error("Invalid token script")
            }
            const tx = await buildLeapTx({
                outIndex: selectedUtxo!.vout,
                btcTxId: selectedUtxo!.txid,
                transferAmount: BigInt(
                    BigNumber(leapAmount)
                        .times(10 ** token!.decimal)
                        .toString()
                ),
                xudtType: tokenScript,
                feeRate: BigInt(5000)
            })
            setBuildError('')
            setTx(tx)
            setStep(3)
        } catch (e:any) {
            console.error(e)
            setBuildError(e.message)
        } finally {
            setBusy(false)
        }


    }

    const handleStep2 = async () => {
        setToAddressError("")
        setAmountError("")

        if (!toBtcAddress) {
            setToAddressError("Please enter the address")
            return
        }

        if (!isBtcAddress(toBtcAddress, network === "mainnet")) {
            setToAddressError("Invalid address")
            return
        }


        if (!token) {
            setTokenError('Please select a token')
            return
        }

        if (!leapAmount) {
            setAmountError("Please enter the amount")
            return
        }

        if (Number(leapAmount) <= 0) {
            setAmountError("Invalid amount")
            return
        }

        if (Number(leapAmount) * 10 ** token!.decimal > Number(token!.amount)) {
            setAmountError("Insufficient balance")
            return
        }

        setLeapAmount(Number(leapAmount).toString())
        setStep(2)
    }

    const handleLeap = async () => {
        setBusy(true)
        setTxError("")
        if (!tx) return

        try {
            const txHash = await leap(tx)
            setStep(4)
            setTxHash(txHash)
        } catch (e: any) {
            console.error(e)
            setTxError(e.message)
        } finally {
            setBusy(false)
        }
    }

    const handleCreateUTXO = async () => {
        setBusy(true)
        setTxError("")
        if (btcFeeRate === 0) {
            setTxError("Please enter a valid fee rate")
            setBusy(false)
            return
        }
        try {
            const txHash = await createUTXO({
                btcAddress: toBtcAddress,
                feeRate: btcFeeRate
            })
            console.log("txHash", txHash)
            setStep(6)
            setTxHash(txHash)
        } catch (e: any) {
            console.error(e)
            setTxError(e.message)
        } finally {
            setBusy(false)
        }
    }

    const [fee, setFee] = useState("0")
    const {client} = useCcc()
    useEffect(() => {
        const calculateFee = async () => {
            if (!tx) return
            const inputCap = await tx.getInputsCapacity(client)
            const outCap = tx.getOutputsCapacity()
            const fee = inputCap - outCap
            setFee(fee.toString())
        }

        calculateFee()
    }, [tx])

    useEffect(() => {
        if (!!xudtBalance && xudtBalance.length) {
            setToken(xudtBalance[0])
        }
    }, [xudtBalance]);

    const tokenList = useMemo(() => {
        return xudtBalance.map(token => ({id: token.symbol, label: token.symbol, ...token}))
    }, [xudtBalance])

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
                        {step !== 5 && step !== 6 && (
                            <>
                                <div className="flex flex-row justify-between items-center mb-1">
                                    <div className="font-semibold text-2xl">{lang["Leap_l2_to_l1"]}</div>
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
                                    className="text-sm mb-5">{lang['Moving assets to other chains with RGB++ Protocol']}</div>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <div className="font-semibold mb-1">{lang["Leap_To"]}</div>
                                <Input
                                    value={toBtcAddress}
                                    placeholder={lang["Bitcoin_Address"]}
                                    onChange={e => {
                                        setToBtcAddress(e.target.value)
                                    }}
                                />

                                <div className="font-normal text-red-400 mt-1 break-words">{toAddressError}</div>

                                <div className="font-semibold mb-1 mt-4">{lang["Assets"]}</div>
                                <Select
                                    className="bg-[#F8F9F8] rounded-lg px-2 py-3"
                                    placeholder={'Select Token...'}
                                    disabled={!tokenList.length || xudtBalenceStatus === "loading"}
                                    value={token?.symbol}
                                    onValueChange={value => {
                                        const target = xudtBalance.find(token => token.symbol === value)
                                        !!target && setToken(target)
                                    }}
                                    options={tokenList}
                                    getValueLabel={token ? () => <div className="flex flex-row items-center">
                                        <TokenIcon symbol={token!.symbol} size={24}/>
                                        <div>{token?.symbol}</div>
                                    </div> : undefined}
                                    getOptionLabel={(opt) => <div className="flex flex-row items-center">
                                        <TokenIcon symbol={opt.symbol} size={24}/>
                                        <div>{opt.symbol}</div>
                                    </div>}
                                />
                                <div className="font-normal text-red-400 mt-1 break-words">{tokenError}</div>

                                <div className="font-semibold mb-10 mt-4">
                                    <div className="mb-2 flex-row flex items-center justify-between">
                                        <div>{lang["Amount"]}</div>
                                        <div className="font-normal">
                                            <span className="text-gray-500"> Balance:</span>{" "}
                                            {token ? toDisplay(token!.amount, token!.decimal, true) : "--"}
                                        </div>
                                    </div>
                                    <Input
                                        value={leapAmount}
                                        type={"text"}
                                        placeholder={lang["Leap amount"]}
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
                                            setLeapAmount(value)
                                        }}
                                        endIcon={
                                            <div className="cursor-pointer text-[#6CD7B2]" onClick={setMaxAmount}>
                                                Max
                                            </div>
                                        }
                                    />
                                    <div className="font-normal text-red-400 mt-1 break-words">{amountError}</div>
                                </div>

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
                                    <Button btntype={"primary"} disabled={!toBtcAddress} onClick={handleStep2}>
                                        {lang["Next"]}
                                    </Button>
                                </div>
                            </>
                        )}


                        {step === 2 && (
                            <>
                                <div className="font-semibold mb-1">{lang["Select_An_UTXO_To_Leap"]}</div>
                                <div className="mb-2 flex flex-row items-center bg-orange-50 py-2 px-3 rounded-lg">
                                    <i className="uil-info-circle mr-2 text-2xl align-middle text-orange-300" />
                                    <div className="text-xs">
                                        {
                                            lang[
                                                "It_Is_Recommended_To_Use_546_Satoshi_UTXO_To_Avoid_Being_Accidentally_Spent_And_wasted"
                                            ]
                                        }
                                        { isBtcWallet && (
                                            <span
                                                className="cursor-pointer text-blue-500 ml-2 hover:underline"
                                                onClick={e => {
                                                    setStep(5)
                                                }}
                                            >
                                                {lang["Create_A_New_UTXO"]}
                                                <i className="uil-arrow-right" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {busy && (
                                    <div className="flex flex-row w-full flex-wrap mb-4 child h-[104px] [&>*:nth-child(2n)]:mr-0">
                                        <div className="loading-bg h-24 my-1 grow-0 rounded w-[calc(50%-4px)] my-1 border mr-2" />
                                        <div className="loading-bg h-24 my-1 grow-0 rounded w-[calc(50%-4px)] my-1 border mr-2" />
                                    </div>
                                )}

                                {!busy && (
                                    <div className="flex flex-row w-full flex-wrap mb-4 max-h-[208px] overflow-auto [&>*:nth-child(2n)]:mr-0">
                                        {utxos.length > 0 ? (
                                            utxos.map((uxto, index) => {
                                                const isSelected =
                                                    selectedUtxo?.txid === uxto.txid && selectedUtxo?.vout === uxto.vout

                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={e => {
                                                            setSelectedUtxo(uxto)
                                                        }}
                                                        className={`${isSelected ? "outline outline-2 outline-[#6cd7b2] outline-offset-[-2px]" : ""} cursor-pointer h-24 grow-0 rounded w-[calc(50%-4px)] my-1 border mr-2 overflow-hidden`}
                                                    >
                                                        <a
                                                            href={`${config.btc_explorer}/tx/${uxto.txid}`}
                                                            onClick={e => e.stopPropagation()}
                                                            target={"_blank"}
                                                            className="hover:underline  flex flex-row items-center bg-[#fffbf5] p-2 text-xs overflow-hidden" rel="noreferrer"
                                                        >
                                                            Tx: {shortTransactionHash(uxto.txid)}
                                                        </a>
                                                        <div className="flex flex-row items-center p-2">
                                                            <TokenIcon size={28} symbol={"BTC"} />
                                                            <div className="text-sm">
                                                                <div>BTC</div>
                                                                <div className="font-semibold">
                                                                    {toDisplay(uxto.value.toString(), 8, true)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="h-[104px] flex items-center justify-center flex-row w-full bg-gray-50 rounded text-gray-300">
                                                No Data
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="font-normal text-red-400 mt-1 break-words mb-1">{buildError}</div>

                                <div className="flex flex-row">
                                    <Button
                                        btntype={"secondary"}
                                        className="mr-4"
                                        onClick={e => {
                                            setSelectedUtxo(null)
                                            setStep(1)
                                        }}
                                    >
                                        {lang["Cancel"]}
                                    </Button>
                                    <Button
                                        btntype={"primary"}
                                        disabled={busy || xudtBalenceStatus === "loading" || !selectedUtxo}
                                        onClick={handleStep3}
                                    >
                                        {lang["Next"]}
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 mt-8 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">From</div>
                                    <div>
                                        {address ? (
                                            <ProfileAddresses addresses={[address]} defaultAddress={address} />
                                        ) : (
                                            "--"
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">{lang["To"]}</div>
                                    <div>
                                        {toBtcAddress ? (
                                            <ProfileAddresses
                                                addresses={[toBtcAddress]}
                                                defaultAddress={toBtcAddress}
                                            />
                                        ) : (
                                            "--"
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">{lang["Leap_Amount"]}</div>
                                    <div>
                                        {leapAmount ? leapAmount : "--"} {token?.symbol}
                                    </div>
                                </div>
                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">{lang["Fee_Rate"]}</div>
                                    <div>5000 shannons/KB</div>
                                </div>
                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">{lang["Network_Fee"]}</div>
                                    <div>{toDisplay(fee, 8, true)} CKB</div>
                                </div>
                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">{lang["Capacity_Fee"]}</div>
                                    <div>253 CKB</div>
                                </div>

                                <div className="font-normal text-red-400 mt-1 break-words mb-1">{txError}</div>

                                <div className="flex flex-row mt-8">
                                    <Button
                                        btntype={"secondary"}
                                        className="mr-4"
                                        onClick={e => {
                                            setStep(2)
                                        }}
                                    >
                                        {lang["Cancel"]}
                                    </Button>
                                    <Button btntype={"primary"} loading={busy} onClick={handleLeap}>
                                        {lang["Leap"]}
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === 4 && (
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

                                    {/*<div className="flex flex-row flex-nowrap justify-between text-sm mb-2">*/}
                                    {/*    <div className="text-gray-500">Transaction fee</div>*/}
                                    {/*    <div className="font-semibold">{--} CKB</div>*/}
                                    {/*</div>*/}

                                    <div className="h-[1px] bg-gray-200 my-4" />

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["From"]}</div>
                                        <div className="font-semibold">
                                            {address ? (
                                                <ProfileAddresses addresses={[address]} defaultAddress={address} />
                                            ) : (
                                                "--"
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["To"]}</div>
                                        <div className="font-semibold">
                                            {toBtcAddress ? (
                                                <ProfileAddresses
                                                    addresses={[toBtcAddress]}
                                                    defaultAddress={toBtcAddress}
                                                />
                                            ) : (
                                                "--"
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["Leap_Amount"]}</div>
                                        <div className="font-semibold">
                                            {leapAmount || "--"} {token?.symbol}
                                        </div>
                                    </div>

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["Network_Fee"]}</div>
                                        <div className="font-semibold">{toDisplay(fee, 8, true)} CKB</div>
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
                                        onClick={e => {
                                            window.open(`${config.explorer}/transaction/${txHash}`, "_blank")
                                        }}
                                    >
                                        {lang["View on Explorer"]}
                                    </Button>

                                    <Button
                                        btntype={"primary"}
                                        onClick={e => {
                                            setOpen(false)
                                        }}
                                    >
                                        {lang["Done"]}
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === 5 && (
                            <>
                                <div className="flex flex-row justify-between items-center mb-4">
                                    <div className="font-semibold text-2xl">{lang["Create_UTXO"]}</div>
                                    <div
                                        onClick={e => {
                                            setOpen(false)
                                        }}
                                        className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100"
                                    >
                                        <i className="uil-times text-gray-500" />
                                    </div>
                                </div>

                                <div>{lang["Create_An_UTXO_To_Leap_Assets"]}</div>
                                <div className="text-sm text-gray-500 mb-4">The amount of UTXO is 10000 satoshi dute to the minimum amount of transferring BTC</div>

                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 mt-8 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">
                                        <TokenIcon size={18} symbol={"BTC"} />
                                        BTC
                                    </div>
                                    <div>
                                        {BigNumber(10000)
                                            .div(10 ** 8)
                                            .toFormat(8)}{" "}
                                        BTC
                                    </div>
                                </div>

                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">{lang["From"]}</div>
                                    <div>
                                        {!!internalAddress ? (
                                            <ProfileAddresses
                                                addresses={[internalAddress]}
                                                defaultAddress={internalAddress}
                                            />
                                        ) : (
                                            "--"
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">{lang["To"]}</div>
                                    <div>
                                        {toBtcAddress ? (
                                            <ProfileAddresses
                                                addresses={[toBtcAddress]}
                                                defaultAddress={toBtcAddress}
                                            />
                                        ) : (
                                            "--"
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-row flex-nowrap justify-between items-center mb-4 text-sm">
                                    <div className="flex flex-row flex-nowrap items-center">{lang["Fee_Rate"]}</div>
                                    <div className="flex flex-row items-center">
                                        <Input
                                            value={btcFeeRate}
                                            className={"w-[100px] text-center font-semibold"}
                                            type={"text"}
                                            placeholder={lang["fee rate"]}
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
                                                setBtcFeeRate(Number(value))
                                            }}
                                        />
                                        <span className="ml-2">Sat/vB</span>
                                    </div>
                                </div>

                                <div className="font-normal text-red-400 mt-1 break-words mb-1">{txError}</div>

                                <div className="flex mt-8">
                                    <Button
                                        btntype={"secondary"}
                                        className={"mr-4"}
                                        onClick={e => {
                                            setTxError("")
                                            setStep(2)
                                        }}
                                    >
                                        {lang["Cancel"]}
                                    </Button>

                                    <Button btntype={"primary"} onClick={handleCreateUTXO}>
                                        {lang["Transfer"]}
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === 6 && (
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
                                <div className="font-semibold text-center text-lg mb-2">
                                    {lang["Transaction Sent !"]}
                                </div>
                                <div className="text-center">{lang["Once the transaction is confirmed,"]}</div>
                                <div className="text-center"> {lang["you can use this UTXO to leap assets."]}</div>

                                <div className="my-4 p-3 bg-gray-100 rounded-lg">
                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">Time</div>
                                        <div className="font-semibold">{dayjs().format("YYYY-MM-DD HH:mm")}</div>
                                    </div>

                                    <div className="h-[1px] bg-gray-200 my-4" />

                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["From"]}</div>
                                        <div className="font-semibold">
                                            {!!internalAddress ? (
                                                <ProfileAddresses
                                                    addresses={[internalAddress]}
                                                    defaultAddress={internalAddress}
                                                />
                                            ) : (
                                                "--"
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["To"]}</div>
                                        <div className="font-semibold">
                                            {!!toBtcAddress ? (
                                                <ProfileAddresses
                                                    addresses={[toBtcAddress]}
                                                    defaultAddress={toBtcAddress}
                                                />
                                            ) : (
                                                "--"
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                        <div className="text-gray-500">{lang["Amount"]}</div>
                                        <div className="font-semibold">{toDisplay("546", 8, true)} BTC</div>
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

                                <div className="flex mt-8">
                                    <Button
                                        btntype={"secondary"}
                                        className={"mr-4 text-xs"}
                                        onClick={e => {
                                            window.open(`${config.btc_explorer}/tx/${txHash}`, "_blank")
                                        }}
                                    >
                                        {lang["View on Explorer"]}
                                    </Button>

                                    <Button
                                        btntype={"primary"}
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
