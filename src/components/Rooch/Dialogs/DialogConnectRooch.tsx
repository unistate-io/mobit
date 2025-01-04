import * as Dialog from '@radix-ui/react-dialog'
import React, {useState, ReactNode, useContext} from "react";
import Button from "@/components/Form/Button/Button";
import {RoochContext} from "@/providers/RoochProvider/RoochProvider"

export default function DialogConnectRooch(props: {children: ReactNode, className?: string, onSelected?: () => void}) {
    const [open, setOpen] = useState(false)
    const {connect, wallets} = useContext(RoochContext)

    return <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={props.className}>
            {props.children}
        </Dialog.Trigger>
        <Dialog.Portal>
            <Dialog.Overlay
                className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0"/>

            <Dialog.Content
                className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] p-4 max-w-[360px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
                <div className="w-[300px] h-auto rounded-lg">
                    <div className="text-lg font-semibold mb-2">Select Wallet</div>
                    {!wallets.length && <div className="h-[88px] text-gray-500 text-sm bg-gray-100 rounded-lg font-semibold flex flex-col items-center justify-center">
                        No wallet found
                    </div>
                    }

                    {wallets.map((wallet, i)=> {
                        return <Button className="mb-3 last:mb-0" key={i} onClick={() => {connect(wallet)}}>
                            <div className="flex flex-col justify-center items-center">
                                <img src={wallet.getIcon()} className="w-[40px] h-[40px] rounded" alt=""/>
                                <div>{wallet.getName()}</div>
                            </div>
                        </Button>
                    })}
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}