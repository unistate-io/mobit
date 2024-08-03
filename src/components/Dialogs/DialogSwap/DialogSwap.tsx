import {useUtxoSwap} from "@/serves/useUtxoSwap"
import {Pool, Token} from '@utxoswap/swap-sdk-js'
import * as Dialog from '@radix-ui/react-dialog'
import React, {useContext, useEffect, useMemo, useState} from "react"
import Input from "@/components/Form/Input/Input"
import Select, {SelectOption} from "@/components/Select/Select"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import useCkbBalance from "@/serves/useCkbBalance"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {getXudtBalance} from "@/serves/useXudtBalance"
import {queryAddressInfoWithAddress} from "@/utils/graphql";

const ckb: Token  = {
    decimals: 8,
    name: 'CKB',
    symbol: 'CKB',
    typeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    logo: 'https://storage.utxoswap.xyz/images/ckb.png'
}


export default function DialogSwap({children, className}: { className?: string, children: React.ReactNode }) {
    const {addresses, network} = useContext(CKBContext)

    const {pools} = useUtxoSwap()
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1)

    const {data: ckbBalence, status: ckbBalenceStatus} = useCkbBalance(addresses)

    const [swapForm, setSwapForm] = useState<{
        pool: Pool | null,
        selectedX: Token | null,
        amountX: string,
        selectedY: Token | null,
        amountY: string
    }>({
        pool: null,
        selectedX: null,
        amountX: '',
        selectedY: null,
        amountY: ''
    })

    useEffect(() => {
        console.log('swapForm', swapForm)
    }, [swapForm]);


    const swapFromOptions = useMemo<SelectOption[]>(() => {
        if (!pools || !pools.length) return []

        let tokens: Token[] = []

        if (!!swapForm.selectedY) {
            const list = pools.filter(pool => pool.assetX.typeHash === swapForm.selectedY!.typeHash || pool.assetY.typeHash === swapForm.selectedY!.typeHash)
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

        return tokens.map(t => (
            {
                id: t.typeHash,
                label: t.symbol,
                token: t
            }
        ))
    }, [pools, swapForm.selectedY])

    const swapToOptions = useMemo<SelectOption[]>(() => {
        if (!pools || !pools.length) return []

        let tokens: Token[] = []

        if (!!swapForm.selectedX) {
            const list = pools.filter(pool => pool.assetX.typeHash === swapForm.selectedX!.typeHash || pool.assetY.typeHash === swapForm.selectedX!.typeHash)
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

        return tokens.map(t => (
            {
                id: t.typeHash,
                label: t.symbol,
                token: t
            }
        ))
    }, [pools, swapForm.selectedX])

    const handleReverse = () => {
        setSwapForm({
            ...swapForm,
            selectedX: swapForm.selectedY,
            selectedY: swapForm.selectedX,
            amountX: '',
            amountY: ''
        })
    }


    const [tokenXBalence, setTokenXBalence] = useState<string>('0')
    const [tokenYBalence, setTokenYBalence] = useState<string>('0')

    useEffect(() => {
        if (!swapForm.selectedX || swapForm.selectedX?.typeHash === ckb.typeHash) {
            setTokenXBalence('0')
            return
        }

        (async ()=> {
            const typeHash = swapForm.selectedX?.typeHash?.replace('0', '\\')
            const tokens = await queryAddressInfoWithAddress([typeHash!], network === 'mainnet')
            console.log('token X infos', tokens)
            if (!tokens[0]) {
                setTokenXBalence('0')
                return
            }
        })()

    }, [network, swapForm.selectedX]);


    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className={className}>
                {children}
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay
                    className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0"/><Dialog.Content
                className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] max-h-[85vh]  max-w-[90vw] w-full translate-x-[-50%] md:max-w-[450px] translate-y-[-50%] rounded-xl bg-white p-4 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">

                {
                    step === 1 && <>
                        <div className="flex flex-row justify-between items-center mb-4">
                            <div className="font-semibold text-2xl">Swap</div>
                            <div onClick={e => {
                                setOpen(false)
                            }}
                                 className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100">
                                <i className="uil-times text-gray-500"/>
                            </div>
                        </div>

                        <div className="flex flex-col relative">
                            <div onClick={handleReverse}
                                 style={{boxShadow: '0px 1.988px 18px 0px rgba(0, 0, 0, 0.10)'}}
                                 className="bg-white left-[50%] top-[50%] ml-[-20px] mt-[-30px] absolute cursor-pointer w-10 h-10 flex flex-row justify-center items-center rounded-full">
                                <i className="uil-arrow-down" />
                            </div>

                            <div className="flex flex-col py-5 border rounded-2xl mb-4">
                                <div className="flex flex-row items-center justify-between mb-2 px-5">
                                    <div className="text-lg font-semibold text-[#7B7C7B]">Sell</div>
                                    <div className="text-sm">Balance: <span className="font-semibold">--</span></div>
                                </div>
                                <div className="flex flex-row items-center px-5">
                                    <div className="mr-4 flex-1 font-semibold text-lg">
                                        <Input
                                            className="w-full"
                                            type="number"
                                            bg={'#fff'}
                                            value={swapForm.amountX}
                                            onChange={e => {
                                                setSwapForm({
                                                    ...swapForm,
                                                    amountX: e.target.value
                                                })
                                            }}
                                            placeholder={'0'}/>
                                    </div>
                                    <div className="bg-gray-100 px-3 py-3 rounded-xl">
                                        <Select
                                            options={swapFromOptions}
                                            placeholder={'Select Token'}
                                            className="w-40"
                                            getValueLabel={() => {
                                                if (!swapForm.selectedX) return undefined
                                                return <div className="flex flex-row items-center">
                                                    {!!swapForm.selectedX!.logo ?
                                                        <img className="w-5 h-5 rounded-full mr-3"
                                                             src={swapForm.selectedX!.logo}
                                                             alt=""/>
                                                        : <TokenIcon symbol={swapForm.selectedX!.symbol} size={20} />
                                                    }

                                                    <div>{swapForm.selectedX!.symbol}</div>
                                                </div>
                                            }}
                                            getOptionLabel={(opt) => {
                                                if (!swapForm.selectedX) return undefined
                                                return <div className="flex flex-row items-center">
                                                    {!!opt.token.logo ?
                                                        <img className="w-5 h-5 rounded-full mr-3"
                                                             src={opt.token.logo}
                                                             alt=""/>
                                                        : <TokenIcon symbol={opt.token.symbol} size={20} />
                                                    }

                                                    <div>{opt.token.symbol}</div>
                                                </div>
                                            }}
                                            onValueChange={(value) => {
                                                setSwapForm({
                                                    ...swapForm,
                                                    selectedX: swapFromOptions.find(opt => opt.id === value)?.token || null
                                                })
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col py-5 border rounded-2xl mb-4">
                                <div className="flex flex-row items-center justify-between mb-2 px-5">
                                    <div className="text-lg font-semibold text-[#7B7C7B]">Buy</div>
                                    <div className="text-sm">Balance: <span className="font-semibold">--</span></div>
                                </div>
                                <div className="flex flex-row items-center px-5">
                                    <div className="mr-4 flex-1 font-semibold text-lg">
                                        <Input
                                            disabled={true}
                                            className="w-full"
                                            type="number"
                                            bg={'#fff'}
                                            value={swapForm.amountY}
                                            placeholder={'0'}/>
                                    </div>
                                    <div className="bg-gray-100 px-3 py-3 rounded-xl">
                                        <Select
                                            options={swapToOptions}
                                            placeholder={'Select Token'}
                                            className="w-40"
                                            getValueLabel={() => {
                                                if (!swapForm.selectedY) return undefined
                                                return <div className="flex flex-row items-center">
                                                    {!!swapForm.selectedY!.logo ?
                                                        <img className="w-5 h-5 rounded-full mr-3"
                                                             src={swapForm.selectedY!.logo}
                                                             alt=""/>
                                                        : <TokenIcon symbol={swapForm.selectedY!.symbol} size={20} />
                                                    }
                                                    <div>{swapForm.selectedY!.symbol}</div>
                                                </div>
                                            }}
                                            getOptionLabel={(opt) => {
                                                if (!swapForm.selectedX) return undefined
                                                return <div className="flex flex-row items-center">
                                                    {!!opt.token.logo ?
                                                        <img className="w-5 h-5 rounded-full mr-3"
                                                             src={opt.token.logo}
                                                             alt=""/>
                                                        : <TokenIcon symbol={opt.token.symbol} size={20} />
                                                    }

                                                    <div>{opt.token.symbol}</div>
                                                </div>
                                            }}
                                            onValueChange={(value) => {
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
                    </>
                }
            </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
