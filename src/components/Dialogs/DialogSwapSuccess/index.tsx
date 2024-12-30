import CopyText from '@/components/CopyText/CopyText'
import Button from '@/components/Form/Button/Button'
import { SwapForm } from '@/pages/Trade/SwapView'
import { LangContext } from '@/providers/LangProvider/LangProvider'
import { shortTransactionHash } from '@/utils/common'
import * as Dialog from '@radix-ui/react-dialog'
import BigNumber from 'bignumber.js'
import dayjs from 'dayjs'
import { useContext } from 'react'

interface Props {
    open: boolean
    swapForm: SwapForm
    txHash: string
    onClose: () => void
}


export const SwapSuccess = ({ open, onClose, swapForm, txHash }: Props) => {

    const { lang } = useContext(LangContext)

    return <Dialog.Root open={open} >
        <Dialog.Portal>
            <Dialog.Overlay
                className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0" />
            <Dialog.Content
                onPointerDownOutside={e => { e.preventDefault() }}
                className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] py-5 px-10 max-w-[98vw] w-full md:max-w-[550px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
                <div className="h-full overflow-auto max-h-[88vh] w-full">

                    <div className="flex flex-row justify-center items-center mb-4 mt-2">
                        <svg width="73" height="72" viewBox="0 0 73 72" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <g clipPath="url(#clip0_699_1259)">
                                <circle cx="36.5" cy="36" r="36" fill="#41D195" fillOpacity="0.12" />
                                <path
                                    d="M37 19.3335C27.8167 19.3335 20.3333 26.8168 20.3333 36.0002C20.3333 45.1835 27.8167 52.6668 37 52.6668C46.1833 52.6668 53.6667 45.1835 53.6667 36.0002C53.6667 26.8168 46.1833 19.3335 37 19.3335ZM44.9667 32.1668L35.5167 41.6168C35.2833 41.8502 34.9667 41.9835 34.6333 41.9835C34.3 41.9835 33.9833 41.8502 33.75 41.6168L29.0333 36.9002C28.55 36.4168 28.55 35.6168 29.0333 35.1335C29.5167 34.6502 30.3167 34.6502 30.8 35.1335L34.6333 38.9668L43.2 30.4002C43.6833 29.9168 44.4833 29.9168 44.9667 30.4002C45.45 30.8835 45.45 31.6668 44.9667 32.1668Z"
                                    fill="#41D195" />
                            </g>
                            <defs>
                                <clipPath id="clip0_699_1259">
                                    <rect width="72" height="72" fill="white" transform="translate(0.5)" />
                                </clipPath>
                            </defs>
                        </svg>
                    </div>
                    <div className="font-medium text-center text-xl text-[#272928]">{lang['Transaction Sent !']}</div>
                    <div className="text-center text-sm mt-1">{lang['The transaction is sent and will be confirmed later']}
                    </div>

                    <div className="mt-4 mb-[124px] p-3 bg-[#F8F9F8] rounded-lg">
                        <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                            <div className="text-gray-500">{lang['Sell']}</div>
                            <div
                                className="font-semibold">{swapForm.amountX || '--'} {swapForm.selectedX?.symbol}</div>
                        </div>

                        <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                            <div className="text-gray-500">{lang['Buy']}</div>
                            <div
                                className="font-semibold">{swapForm.amountY || '--'} {swapForm.selectedY?.symbol}</div>
                        </div>

                        <div className="h-[1px] bg-gray-200 my-4" />

                        {!!swapForm.pool && swapForm.amountX &&
                            <>
                                <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                                    <div className="text-gray-500">{lang['Transaction fee']}</div>
                                    <div
                                        className="font-semibold">{BigNumber(swapForm.amountX).times((swapForm.pool as any).poolInfo.feeRate / 10000).toFormat()} {swapForm.selectedX?.symbol}</div>
                                </div>
                                <div className="h-[1px] bg-gray-200 my-4" />
                            </>
                        }

                        {/*<div className="flex flex-row flex-nowrap justify-between text-sm mb-2">*/}
                        {/*    <div className="text-gray-500">Network fee</div>*/}
                        {/*    <div className="font-semibold">-- CKB</div>*/}
                        {/*</div>*/}


                        <div className="flex flex-row flex-nowrap justify-between text-sm mb-2">
                            <div className="text-gray-500">{lang['Time']}</div>
                            <div className="font-semibold">{dayjs().format("YYYY-MM-DD HH:mm")}</div>
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
                        <Button
                            style={{ backgroundColor: '#272928' }}
                            className=' text-white hover:bg-[#272928] text-sm'
                            onClick={onClose}>
                            {lang['Done']}
                        </Button>
                    </div>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}