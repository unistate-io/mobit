import {UserContext} from '@/providers/UserProvider/UserProvider'
import {useContext} from "react";
import Background from "@/components/Background/Background";
import Avatar from "@/components/Avatar/Avatar";
import AddressCapsule, {showAddress} from "@/components/AddressCapsule/AddressCapsule";
import {CKBContext} from "@/providers/CKBProvider/CKBProvider";

export default function Profile() {
    const {address, isOwner, theme} = useContext(UserContext)
    const {internalAddress} = useContext(CKBContext)


    return <div className="h-[3000px]">
        <Background gradient={theme.bg}/>
        <div className="max-w-[1044px] mx-auto px-3">
            <div
                className="w-[200px] h-[200px] rounded-full overflow-hidden mt-[-100px]  border-4 border-white hidden md:block">
                <Avatar size={200} name={address!} colors={theme.colors}/>
            </div>
            <div
                className="w-[128px] h-[128px] rounded-full overflow-hidden mt-[-64px] mx-auto border-4 border-white md:hidden">
                <Avatar size={128} name={address!} colors={theme.colors}/>
            </div>
            <div className="mt-4 flex flex-col items-center md:flex-row">
                <div className="colorful text-3xl font-bold mr-5 mb-4"
                     style={{background: theme.text, backgroundClip: 'text'}}>
                    {showAddress(address!)}
                </div>

                <div className="mb-4"><AddressCapsule address={address!} label={'CKB'}/></div>

                {isOwner && internalAddress &&
                    <div className="mb-4"><AddressCapsule address={internalAddress}/></div>
                }
            </div>
        </div>
    </div>
}
