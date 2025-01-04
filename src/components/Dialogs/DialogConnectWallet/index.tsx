import * as Dialog from '@radix-ui/react-dialog'
import React, {useState, ReactNode, useContext} from "react";
import Button from "@/components/Form/Button/Button";
import {CKBContext} from "@/providers/CKBProvider/CKBProvider";
import DialogConnectRooch from "@/components/Rooch/Dialogs/DialogConnectRooch";


export default function DialogConnectWallet(props: {children: ReactNode, className?: string}) {
    const [open, setOpen] = useState(false)
    const { open:CkbConnect } = useContext(CKBContext)

    return  <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={props.className}>
            {props.children}
        </Dialog.Trigger>
        <Dialog.Portal>
            <Dialog.Overlay
                className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0"/>
            <Dialog.Content
                className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] p-4 max-w-[360px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
                <div className="w-[300px] h-auto rounded-lg">
                    <Button className="mb-3" onClick={() => {CkbConnect();setOpen(false)}}>
                        <div className="flex flex-row w-full items-center justify-between">
                            <div className="flex flex-row w-full items-center">
                                <img className="w-6 h-6 rounded-full mr-2"
                                      src="/images/logo_ckb.png" alt=""/>
                                <div>CKB</div>
                            </div>
                            <i className="uil-arrow-right text-2xl" />
                        </div>
                    </Button>
                    <DialogConnectRooch onSelected={() => setOpen(false)}  className="w-full">
                        <Button className="w-full">
                            <div className="flex flex-row w-full items-center justify-between">
                                <div className="flex flex-row w-full items-center">
                                    <img className="w-6 h-6 rounded-full mr-2"
                                         src="/images/rooch.jpg" alt=""/>
                                    <div>Rooch</div>
                                </div>
                                <i className="uil-arrow-right text-2xl"/>
                            </div>
                        </Button>
                    </DialogConnectRooch>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>
}