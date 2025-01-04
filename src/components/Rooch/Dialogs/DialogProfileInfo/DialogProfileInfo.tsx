import Avatar from "@/components/Avatar/Avatar"
import React, {useContext } from "react"
import * as Dialog from '@radix-ui/react-dialog'
import {getTheme} from "@/providers/UserProvider/themes"
import CopyText from "@/components/CopyText/CopyText"
import {shortTransactionHash} from "@/utils/common"
import Button from "@/components/Form/Button/Button"
import Select from "@/components/Select/Select"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import {RoochContext} from "@/providers/RoochProvider/RoochProvider";
import {useCurrentWallet} from "@roochnetwork/rooch-sdk-kit";

export default function DialogProfileInfo({children, className}: {children: React.ReactNode, className?: string}) {
    const {roochAddress, btcAddress, disconnect} = useContext(RoochContext)
    const currentWallet = useCurrentWallet()
    const [open, setOpen] = React.useState(false)
    const {lang} = useContext(LangContext)

    return <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={className}>
            {children}
        </Dialog.Trigger>
        <Dialog.Portal>
            <Dialog.Overlay className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0"/>
            <Dialog.Content
                onPointerDownOutside={e=> {e.preventDefault()}}
                className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] max-h-[85vh]  max-w-[90vw] w-full translate-x-[-50%] md:max-w-[450px] translate-y-[-50%] rounded-xl bg-white p-4 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
                <div className="flex flex-row justify-between items-center mb-4">
                    <div className="font-semibold text-2xl">{lang['Connected']}</div>
                    <div onClick={e => {
                        setOpen(false)
                    }}
                         className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100">
                        <i className="uil-times text-gray-500"/>
                    </div>
                </div>

                { !roochAddress &&
                    <div>{lang['Not Wallet founded']}</div>
                }

                { !!roochAddress && !!currentWallet && !!btcAddress &&
                    <>
                        <div className="flex flex-row items-center  w-full">
                            <div className="relative w-[60px] h-[60px]">
                                <Avatar size={60} name={roochAddress} colors={getTheme(roochAddress).colors}/>
                                <img src={currentWallet!.wallet?.getIcon()} alt={currentWallet!.wallet?.getName()}
                                     className="w-6 h-6 rounded-full absolute bottom-0 right-0 border-2 border-white bg-white"
                                />
                            </div>
                            <div className="flex-1 ml-6">
                                <CopyText copyText={roochAddress} className="mb-2">
                                    <div>{shortTransactionHash(roochAddress, 8)}</div>
                                </CopyText>
                                <CopyText copyText={btcAddress}>{shortTransactionHash(btcAddress, 8)}</CopyText>
                            </div>
                        </div>
                        <div className="w-full  mt-4 flex items-center">
                            <div className="mr-4 whitespace-nowrap">{lang['Network']}: </div>
                            <div className="w-full bg-gray-100 rounded-lg p-2 flex items-center">
                                <Select
                                    options={[
                                        // {id: 'mainnet', label: 'CKB Mainnet'},
                                        {id: 'testnet', label: 'Rooch Testnet'},
                                    ]}
                                    value={'testnet'}
                                    containerWidthPrefix={8}
                                    onValueChange={(value) => {
                                       // setNetwork(value as Network)
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex flex-row items-center mt-6">
                            <Button className="mr-4 text-red-500"
                                    onClick={() => {disconnect();setOpen(false)}}
                            >{lang['Disconnect']}</Button>
                            <Button
                                onClick={e=> {setOpen(false)}}
                                className="!bg-[#000]  hover:opacity-[0.8] text-white">{lang['OK']}</Button>
                        </div>
                    </>
                }

            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>

}
