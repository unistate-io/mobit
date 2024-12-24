import { useUtxoSwap } from "@/serves/useUtxoSwap"
import { Pool, Token } from "@utxoswap/swap-sdk-js"
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import Input from "@/components/Form/Input/Input"
import Select from "@/components/Select/Select"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
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
    const [open, setOpen] = useState(false)
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

        return tokens.map(t => ({
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

        return tokens.map(t => ({
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
        if (open) {
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
        }
    }, [open, sellToken, supportTokens])

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

            setTxHash(intentTxHash || "")
            setOpenSuccess(true)
            setSwapForm({
                ...swapForm,
                amountX: "",
                amountY: ""
            })
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

    return (
        <div className="w-full px-3 pt-6 md:px-6">
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
                            <div className="text-lg font-semibold text-[#7B7C7B]">{lang["Sell"]}</div>
                            <div className="text-sm">
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
                            <div className="flex-1 font-semibold text-base mr-2">
                                <Input
                                    type="number"
                                    className="bg-[#fff] w-[100%] "
                                    value={swapForm.amountX}
                                    style={{ backgroundColor: "#fff", fontSize: "36px", fontFamily: "DIN Alternate" }}
                                    onChange={e => {
                                        setSwapForm({
                                            ...swapForm,
                                            amountX: e.target.value
                                        })
                                    }}
                                    placeholder={"0"}
                                />
                            </div>
                            <div className="min-w-[120px]  md:min-w-[160px] grow-0">
                                <DialogExchange options={swapFromOptions} value={swapForm.selectedX || null} onChange={handleSelectedX} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col py-5 border rounded-2xl mb-6 bg-white">
                        <div className="flex flex-row items-center justify-between mb-2 px-5">
                            <div className="text-lg font-semibold text-[#7B7C7B]">{lang["Buy"]}</div>
                            <div className="text-sm">
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
                            <div className="flex-1 font-semibold text-base mr-2">
                                <Input
                                    disabled={true}
                                    className="bg-[#fff] w-[100%]"
                                    style={{ backgroundColor: "#fff", fontSize: "36px", fontFamily: "DIN Alternate" }}
                                    type="number"
                                    value={swapForm.amountY}
                                    placeholder={"0"}
                                />
                            </div>
                            <div className="min-w-[120px] md:min-w-[160px] grow-0 w-[220px]">
                                <Select
                                    className="bg-gray-100 px-3 py-3 rounded-xl h-[56px]"
                                    value={swapForm.selectedY?.typeHash}
                                    options={swapToOptions}
                                    placeholder={lang["Select..."]}
                                    icon={
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                        >
                                            <path
                                                d="M17.92 11.6199C17.8724 11.4972 17.801 11.385 17.71 11.2899L12.71 6.28994C12.6168 6.1967 12.5061 6.12274 12.3842 6.07228C12.2624 6.02182 12.1319 5.99585 12 5.99585C11.7337 5.99585 11.4783 6.10164 11.29 6.28994C11.1968 6.38318 11.1228 6.49387 11.0723 6.61569C11.0219 6.73751 10.9959 6.86808 10.9959 6.99994C10.9959 7.26624 11.1017 7.52164 11.29 7.70994L14.59 10.9999H7C6.73478 10.9999 6.48043 11.1053 6.29289 11.2928C6.10536 11.4804 6 11.7347 6 11.9999C6 12.2652 6.10536 12.5195 6.29289 12.707C6.48043 12.8946 6.73478 12.9999 7 12.9999H14.59L11.29 16.2899C11.1963 16.3829 11.1219 16.4935 11.0711 16.6154C11.0203 16.7372 10.9942 16.8679 10.9942 16.9999C10.9942 17.132 11.0203 17.2627 11.0711 17.3845C11.1219 17.5064 11.1963 17.617 11.29 17.7099C11.383 17.8037 11.4936 17.8781 11.6154 17.9288C11.7373 17.9796 11.868 18.0057 12 18.0057C12.132 18.0057 12.2627 17.9796 12.3846 17.9288C12.5064 17.8781 12.617 17.8037 12.71 17.7099L17.71 12.7099C17.801 12.6148 17.8724 12.5027 17.92 12.3799C18.02 12.1365 18.02 11.8634 17.92 11.6199Z"
                                                fill="black"
                                            />
                                        </svg>
                                    }
                                    getValueLabel={() => {
                                        if (!swapForm.selectedY) return undefined
                                        return (
                                            <div className="flex flex-row items-center flex-1 text-nowrap">
                                                {!!swapForm.selectedY!.logo ? (
                                                    <img
                                                        className="w-12 h-12 rounded-full mr-3"
                                                        src={swapForm.selectedY!.logo}
                                                        alt=""
                                                    />
                                                ) : (
                                                    <TokenIcon symbol={swapForm.selectedY!.symbol} size={48} />
                                                )}
                                                <div className="font-bold text-2xl text-[#272928]">{swapForm.selectedY!.symbol}</div>
                                            </div>
                                        )
                                    }}
                                    getOptionLabel={opt => {
                                        return (
                                            <div className="flex flex-row items-center">
                                                {!!opt.token.logo ? (
                                                    <img
                                                        className="w-5 h-5 rounded-full mr-3"
                                                        src={opt.token.logo}
                                                        alt=""
                                                    />
                                                ) : (
                                                    <TokenIcon symbol={opt.token.symbol} size={20} />
                                                )}

                                                <div>{opt.token.symbol}</div>
                                            </div>
                                        )
                                    }}
                                    onValueChange={value => {
                                        setSwapForm({
                                            ...swapForm,
                                            selectedY: swapToOptions.find(opt => opt.id === value)?.token || null
                                        })
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {!address && (
                    <Button
                        btntype={"primary"}
                        onClick={() => {
                            login()
                            setOpen(false)
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
                        Swap
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
                        <div className="text-sm">{lang["Max slippage"]}</div>
                        <div className="font-semibold">{swapConfig.slippage} %</div>
                    </div>
                    <div className="flex flex-row items-center justify-between px-6 mb-4">
                        {!!swapForm.pool && swapForm.amountX ? (
                            <>
                                <div className="text-sm">
                                    {lang["Fee"]}{" "}
                                    <span>{`(${((swapForm.pool as any).poolInfo.feeRate / 10000).toFixed(
                                        3
                                    )}%)`}</span>
                                </div>
                                <div className="font-semibold">
                                    {BigNumber(swapForm.amountX)
                                        .times((swapForm.pool as any).poolInfo.feeRate / 10000)
                                        .toFormat(8)}{" "}
                                    {swapForm.selectedX?.symbol}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-sm">{lang["Fee"]}</div>
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

            <SwapSuccess open={openSuccess} setOpen={setOpenSuccess} swapForm={swapForm} txHash={txHash} />


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
