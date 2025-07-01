import { useUtxoSwap } from "@/serves/useUtxoSwap"
import { Pool, Token } from "@utxoswap/swap-sdk-js"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import Input from "@/components/Form/Input/Input"
import useCkbBalance from "@/serves/useCkbBalance"
import { CKBContext } from "@/providers/CKBProvider/CKBProvider"
import { getXudtBalance } from "@/serves/useXudtBalance"
import { Collector } from "@/libs/rgnpp_collector/index"
import { toDisplay } from "@/utils/number_display"
import Button from "@/components/Form/Button/Button"
import BigNumber from "bignumber.js"
import { Transaction as CCCTransaction } from "@ckb-ccc/connector-react"
import { append0x } from "@rgbpp-sdk/ckb"
import { LangContext } from "@/providers/LangProvider/LangProvider"

import * as dayjsLib from "dayjs"
import { DialogExchange, SelectOption } from "@/components/Dialogs/DialogExchange"
import { SwapSuccess } from "@/components/Dialogs/DialogSwapSuccess"

const dayjs: any = dayjsLib

const ckb: Token = {
    decimals: 8,
    name: "CKB",
    symbol: "CKB",
    typeHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    logo: "https://storage.utxoswap.xyz/images/ckb.png"
}

export interface SwapForm {
    pool: Pool | null
    selectedX: Token | null
    amountX: string
    selectedY: Token | null
    amountY: string
}

export default function SwapView({ className, sellToken }: { className?: string; sellToken?: string }) {
    const { address, addresses, network, config, open: login, signer } = useContext(CKBContext)
    const { lang } = useContext(LangContext)

    const { pools, client, collector, supportTokens } = useUtxoSwap()
    const [busy, setBusy] = useState(false)
    const [openSuccess, setOpenSuccess] = useState(false)

    const { data: ckbBalence, status: ckbBalenceStatus } = useCkbBalance(addresses)

    const [swapConfig, setSwapConfig] = useState({
        slippage: "0.5",
        networkFeeRate: 5000
    })

    const [txErr, setTxErr] = useState<string>("")
    const [txHash, setTxHash] = useState<string>("")

    const [swapForm, setSwapForm] = useState<SwapForm>({
        pool: null,
        selectedX: null,
        amountX: "",
        selectedY: null,
        amountY: ""
    })

    const swapFromOptions = useMemo<SelectOption[]>(() => {
        if (!pools || !pools.length) return []

        let tokens: Token[] = []

        if (!!swapForm.selectedY) {
            const list = pools.filter(
                pool =>
                    pool.assetX.typeHash === swapForm.selectedY!.typeHash ||
                    pool.assetY.typeHash === swapForm.selectedY!.typeHash
            )
            list.forEach(pool => {
                tokens.push(pool.assetX.typeHash === swapForm.selectedY!.typeHash ? pool.assetY : pool.assetX)
            })
        } else {
            pools.forEach(pool => {
                if (tokens.find(t => t.typeHash === pool.assetX.typeHash) === undefined) {
                    tokens.push(pool.assetX)
                }
                if (tokens.find(t => t.typeHash === pool.assetY.typeHash) === undefined) {
                    tokens.push(pool.assetY)
                }
            })
        }

        return tokens
        .map(t => ({
            id: t.typeHash,
            label: t.symbol,
            token: t
        }))
    }, [pools, swapForm.selectedY])

    const swapToOptions = useMemo<SelectOption[]>(() => {
        if (!pools || !pools.length) return []

        let tokens: Token[] = []

        if (!!swapForm.selectedX) {
            const list = pools.filter(
                pool =>
                    pool.assetX.typeHash === swapForm.selectedX!.typeHash ||
                    pool.assetY.typeHash === swapForm.selectedX!.typeHash
            )
            list.forEach(pool => {
                tokens.push(pool.assetX.typeHash === swapForm.selectedX!.typeHash ? pool.assetY : pool.assetX)
            })
        } else {
            pools.forEach(pool => {
                if (tokens.find(t => t.typeHash === pool.assetX.typeHash) === undefined) {
                    tokens.push(pool.assetX)
                }
                if (tokens.find(t => t.typeHash === pool.assetY.typeHash) === undefined) {
                    tokens.push(pool.assetY)
                }
            })
        }

        return tokens
        .map(t => ({
            id: t.typeHash,
            label: t.symbol,
            token: t
        }))
    }, [pools, swapForm.selectedX])

    const handleReverse = useCallback(() => {
        setSwapForm({
            ...swapForm,
            selectedX: swapForm.selectedY,
            selectedY: swapForm.selectedX,
            amountX: "",
            amountY: "",
            pool: null
        })
    }, [swapForm])

    const [tokenXBalence, setTokenXBalence] = useState<string>("0")
    const [tokenYBalence, setTokenYBalence] = useState<string>("0")

    useEffect(() => {
        if (!swapForm.selectedX || swapForm.selectedX?.typeHash === ckb.typeHash || !addresses || !addresses.length) {
            setTokenXBalence("0")
            return
        }

        ; (async () => {
            try {
                setBusy(true)
                const collector = new Collector({
                    ckbNodeUrl: config.ckb_rpc,
                    ckbIndexerUrl: config.ckb_indexer!
                })
                const type = swapForm.selectedX?.typeScript!
                const balance = await getXudtBalance(addresses, type, collector)
                console.log("token X balance", balance)
                setTokenXBalence(balance)
            } finally {
                setBusy(false)
            }
        })()
    }, [network, swapForm.selectedX, addresses, config])

    useEffect(() => {
        if (!swapForm.selectedY || swapForm.selectedY?.typeHash === ckb.typeHash || !addresses || !addresses.length) {
            setTokenYBalence("0")
            return
        }

        ; (async () => {
            try {
                setBusy(true)
                const collector = new Collector({
                    ckbNodeUrl: config.ckb_rpc,
                    ckbIndexerUrl: config.ckb_indexer!
                })
                const type = swapForm.selectedY?.typeScript!
                const balance = await getXudtBalance(addresses, type, collector)
                console.log("token Y balance", balance)
                setTokenYBalence(balance)
            } finally {
                setBusy(false)
            }
        })()
    }, [network, swapForm.selectedY, addresses, config])

    const isValidNumber = (value: string) => {
        return !isNaN(Number(value)) && Number(value) >= 0
    }

    const disableSwap = useMemo(() => {
        if (
            !swapForm.selectedX ||
            !swapForm.selectedY ||
            !swapForm.amountX ||
            !isValidNumber(swapForm.amountX) ||
            !swapForm.amountY
        )
            return true

        if (
            swapForm.selectedX.symbol === "CKB" &&
            parseFloat(swapForm.amountX) * 10 ** swapForm.selectedX!.decimals > parseFloat(ckbBalence?.amount || "0")
        )
            return true
        if (
            swapForm.selectedX.symbol !== "CKB" &&
            parseFloat(swapForm.amountX) * 10 ** swapForm.selectedX!.decimals > parseFloat(tokenXBalence)
        )
            return true
    }, [ckbBalence?.amount, swapForm.amountX, swapForm.amountY, swapForm.selectedX, swapForm.selectedY, tokenXBalence])

    useEffect(() => {
        if (!!swapForm.selectedX && !!swapForm.selectedY && !!address) {
            const tokens: [Token, Token] = [swapForm.selectedX, swapForm.selectedY]
            setBusy(true)

            const poolInfo = pools.find(pool => {
                return (
                    (pool.assetX.typeHash === tokens[0].typeHash && pool.assetY.typeHash === tokens[1].typeHash) ||
                    (pool.assetX.typeHash === tokens[1].typeHash && pool.assetY.typeHash === tokens[0].typeHash)
                )
            })

            const newPool = new Pool({
                tokens,
                ckbAddress: address,
                collector,
                client,
                poolInfo: poolInfo!
            })

            const newForm = {
                ...swapForm,
                pool: newPool
            }

            setTimeout(() => {
                setSwapForm(newForm)
                setBusy(false)
            }, 100)
        } else {
            setSwapForm({
                ...swapForm,
                pool: null
            })
        }
    }, [swapForm.selectedX, swapForm.selectedY, address])

    useEffect(() => {
        if (!!swapForm.pool && !!swapForm.amountX) {
            if (!isValidNumber(swapForm.amountX)) {
                setSwapForm({
                    ...swapForm,
                    amountY: ""
                })
                return
            }

            const { output, priceImpact, buyPrice } = swapForm.pool.calculateOutputAmountAndPriceImpactWithExactInput(
                swapForm.amountX
            )

            setSwapForm({
                ...swapForm,
                amountY: output
            })
        } else {
            setSwapForm({
                ...swapForm,
                amountY: ""
            })
        }
    }, [swapForm.pool, swapForm.amountX])

    const price = useMemo(() => {
        if (swapForm.amountY && swapForm.amountX) {
            return BigNumber(swapForm.amountY)
                .div(swapForm.amountX)
                .toFixed(swapForm.selectedY!.decimals || 8)
        } else {
            return "0"
        }
    }, [swapForm.amountX, swapForm.amountY, swapForm.selectedY])

    useEffect(() => {
        let initToken: Token | undefined = undefined
        if (sellToken && supportTokens.length) {
            initToken = supportTokens.find(t => t.typeHash === sellToken) as any
        }

        setSwapForm({
            pool: null,
            selectedX: initToken || ckb,
            amountX: "",
            selectedY: null,
            amountY: ""
        })
        setTxErr("")
        setBusy(false)
    }, [sellToken, supportTokens])

    const signTxFunc = async (rawTx: CKBComponents.RawTransactionToSign) => {
        const txLike = await signer!.signTransaction(rawTx as any)
        return transactionFormatter(txLike)
    }

    const handleSwap = async () => {
        if (!signer) return

        setTxErr("")
        setBusy(true)
        try {
            const intentTxHash = await swapForm.pool!.swapWithExactInput(
                signTxFunc,
                swapConfig.slippage,
                swapConfig.networkFeeRate
            )

            setOpenSuccess(true)
            setTxHash(intentTxHash || "")
        } catch (e: any) {
            console.error(e)
            setTxErr(e.message)
        } finally {
            setBusy(false)
        }
    }

    const handleSetMax = () => {
        if (swapForm.selectedX?.symbol === "CKB") {
            setSwapForm({
                ...swapForm,
                amountX: toDisplay(ckbBalence?.amount || "0", 8)
            })
        } else {
            setSwapForm({
                ...swapForm,
                amountX: toDisplay(tokenXBalence, swapForm.selectedX!.decimals)
            })
        }
    }

    const handleSelectedX = (token: Token) => {
        setSwapForm({
            ...swapForm,
            selectedX: token
        })
    }

    const handleSelectedY = (token: Token) => {
        setSwapForm({
            ...swapForm,
            selectedY: token
        })
    }

    const handleCloseSuccessDialog = () => {
        setOpenSuccess(false)
        setSwapForm({
            ...swapForm,
            amountX: "",
            amountY: ""
        })
    }

    useEffect(() => {
        const perventWheel = (e: Event) => {
            e.preventDefault()
        }
        document.querySelectorAll('input[type="number"]')?.forEach(input => {
            input.addEventListener("mousewheel", perventWheel, {passive: false})
        })

        return () => {
            document.querySelectorAll('input[type="number"]')?.forEach(input => {
                input.removeEventListener("mousewheel", perventWheel)
            })
        }
    }, []);

    return (
        <div className="w-full px-3 pt-2 md:pt-6 md:px-6">
            <>
                <div className="flex flex-col relative">
                    <div
                        onClick={handleReverse}
                        style={{ boxShadow: "0px 1.988px 18px 0px rgba(0, 0, 0, 0.10)" }}
                        className="bg-white left-[50%] top-[50%] ml-[-20px] mt-[-30px] absolute cursor-pointer w-10 h-10 flex flex-row justify-center items-center rounded-full"
                    >
                        <i className="uil-arrow-down" />
                    </div>

                    <div className="flex flex-col py-5 border rounded-2xl mb-2 bg-white">
                        <div className="flex flex-row items-center justify-between mb-2 px-5">
                            <div className="text-[20px] text-[#7B7C7B]">{lang["Sell"]}</div>
                            <div className="text-base">
                                {lang["Balance"]}:{" "}
                                <span className="font-semibold text-base">
                                    {swapForm.selectedX
                                        ? swapForm.selectedX?.symbol === "CKB"
                                            ? toDisplay(ckbBalence?.amount || "0", 8)
                                            : toDisplay(tokenXBalence, swapForm.selectedX.decimals)
                                        : "--"}
                                </span>
                                <span
                                    onClick={handleSetMax}
                                    className="font-semibold cursor-pointer text-[#6cd7b2] ml-2"
                                >
                                    MAX
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-row items-center px-5 justify-between">
                            <div className="flex-1 font-semibold text-base mr-2 min-w-[40%]">
                                <Input
                                    type="number"
                                    className="bg-[#fff] w-[100%] text-3xl sm:text-4xl"
                                    value={swapForm.amountX}
                                    style={{ backgroundColor: "#fff", fontFamily: "DIN Alternate" }}
                                    onChange={e => {
                                        setSwapForm({
                                            ...swapForm,
                                            amountX: e.target.value
                                        })
                                    }}
                                    placeholder={"0"}
                                />
                            </div>
                            <div className="max-w-[220px] w-full">
                                <DialogExchange options={swapFromOptions} value={swapForm.selectedX || null} onChange={handleSelectedX} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col py-5 border rounded-2xl mb-6 bg-white">
                        <div className="flex flex-row items-center justify-between mb-2 px-5">
                            <div className="text-[20px]  text-[#7B7C7B]">{lang["Buy"]}</div>
                            <div className="text-base">
                                {lang["Balance"]}:{" "}
                                <span className="font-semibold text-base">
                                    {swapForm.selectedY
                                        ? swapForm.selectedY?.symbol === "CKB"
                                            ? toDisplay(ckbBalence?.amount || "0", 8)
                                            : toDisplay(tokenYBalence, swapForm.selectedY.decimals)
                                        : "--"}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-row items-center px-5 justify-between">
                            <div className="flex-1 font-semibold text-base mr-2 min-w-[40%]">
                                <Input
                                    disabled={true}
                                    className="bg-[#fff] w-[100%] text-3xl sm:text-4xl"
                                    style={{ backgroundColor: "#fff", fontFamily: "DIN Alternate" }}
                                    type="number"
                                    value={swapForm.amountY}
                                    placeholder={"0"}
                                />
                            </div>
                            <div className="min-w-[120px] md:min-w-[160px] grow-0 w-[220px]">
                                <DialogExchange options={swapToOptions} value={swapForm.selectedY || null} onChange={handleSelectedY} />
                            </div>
                        </div>
                    </div>
                </div>

                {!address && (
                    <Button
                        btntype={"primary"}
                        onClick={() => {
                            login()
                        }}
                    >
                        {lang["Connect Wallet"]}
                    </Button>
                )}

                {!!txErr && <div className="h-6 mb-4 text-red-400">{txErr}</div>}

                {!!address && (
                    <Button
                        disabled={disableSwap}
                        onClick={handleSwap}
                        loading={busy || ckbBalenceStatus === "loading"}
                        btntype={"primary"}
                    >
                       {lang["Swap"]}
                    </Button>
                )}

                <div className="text-center h-6 font-semibold my-6">
                    {!!price &&
                        swapForm.amountY &&
                        swapForm.amountX &&
                        `1 ${swapForm.selectedX!.symbol} ≈ ${price} ${swapForm.selectedY!.symbol}`}
                </div>

                <div className="shadow rounded-xl py-3 bg-white">
                    <div className="flex flex-row items-center justify-between px-6 mb-4">
                        <div className="text-base">{lang["Max slippage"]}</div>
                        <div className="font-semibold" style={{ fontFamily: 'Anonymous Pro' }}>{swapConfig.slippage} %</div>
                    </div>
                    <div className="flex flex-row items-center justify-between px-6 mb-4">
                        {!!swapForm.pool && swapForm.amountX ? (
                            <>
                                <div className="text-base">
                                    {lang["Fee"]}
                                    <span style={{ fontFamily: 'Anonymous Pro' }}>{`(${((swapForm.pool as any).poolInfo.feeRate / 10000).toFixed(
                                        3
                                    )}%)`}</span>
                                </div>
                                <div className="font-semibold" style={{ fontFamily: 'Anonymous Pro' }}>
                                    {BigNumber(swapForm.amountX)
                                        .times((swapForm.pool as any).poolInfo.feeRate / 10000)
                                        .toFormat(8)}
                                    {swapForm.selectedX?.symbol}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-base">{lang["Fee"]}</div>
                                <div className="font-semibold">0</div>
                            </>
                        )}
                    </div>
                    {/*<div className="flex flex-row items-center justify-between px-6">*/}
                    {/*    <div className="text-sm">Network Fee</div>*/}
                    {/*    <div className="font-semibold">{swapConfig.networkFeeRate}</div>*/}
                    {/*</div>*/}
                </div>
            </>

            <SwapSuccess open={openSuccess} onClose={handleCloseSuccessDialog} swapForm={swapForm} txHash={txHash} />


        </div>
    )
}

export function transactionFormatter(transaction: CCCTransaction): CKBComponents.RawTransaction {
    const bigint2Hex = (num: bigint) => {
        return append0x(num.toString(16))
    }

    const { version, cellDeps, headerDeps, inputs, outputs, outputsData, witnesses } = transaction
    return {
        version: bigint2Hex(version),
        cellDeps: cellDeps.map(cell => {
            return {
                outPoint: {
                    txHash: cell.outPoint.txHash,
                    index: bigint2Hex(cell.outPoint.index)
                },
                depType: cell.depType
            }
        }),
        headerDeps,
        inputs: inputs.map(input => {
            return {
                previousOutput: {
                    index: bigint2Hex(input.previousOutput.index),
                    txHash: input.previousOutput.txHash
                },
                since: bigint2Hex(input.since)
            }
        }),
        outputs: outputs.map(output => {
            return {
                capacity: bigint2Hex(output.capacity),
                lock: output.lock,
                type: output.type
            }
        }),
        outputsData: outputsData,
        witnesses
    }
}
