import {UserContext} from '@/providers/UserProvider/UserProvider'
import {useContext, useEffect, useState} from "react";
import Background from "@/components/Background/Background";
import Avatar from "@/components/Avatar/Avatar";
import AddressCapsule, {showAddress} from "@/components/AddressCapsule/AddressCapsule";
import {CKBContext} from "@/providers/CKBProvider/CKBProvider";
import * as Tabs from '@radix-ui/react-tabs';
import ListToken, {TokenBalance} from "@/components/ListToken/ListToken";
import useXudtBalance from "@/serves/useXudtBalance";
import useCkbBalance from "@/serves/useCkbBalance";

export default function Profile() {
    const {address, isOwner, theme} = useContext(UserContext)
    const {internalAddress} = useContext(CKBContext)
    const {data: xudtData, status: xudtDataStatus, error:xudtDataErr} = useXudtBalance(address!)
    const {data: ckbData, status: ckbDataStatus, error:ckbDataErr} = useCkbBalance(address!)

    const [tokens, setTokens] = useState<TokenBalance[]>([])
    const [tokensStatus, setTokensStatus] = useState<string>('loading')

    useEffect(() => {
        console.log('ckbData', ckbData)
        console.log('ckbDataStatus', ckbDataStatus)
        console.log('ckbDataErr', ckbDataErr)
        if (xudtDataStatus === 'complete' && ckbDataStatus === 'complete' && ckbData) {
            setTokens([ckbData, ...xudtData])
            setTokensStatus('complete')
        } if (xudtDataStatus === 'loading' || ckbDataStatus === 'loading') {
            setTokensStatus('loading')
        } else if (xudtDataStatus === 'error' || ckbDataStatus === 'error') {
            setTokensStatus('error')
        }
    }, [xudtData, xudtDataStatus, ckbData, ckbDataStatus])

    return <div className="h-[3000px]">
        <Background gradient={theme.bg}/>
        <div className="max-w-[1044px] mx-auto px-3">
            <div
                className="w-[200px] h-[200px] rounded-full overflow-hidden mt-[-100px] border-4 border-white hidden md:block">
                <Avatar size={200} name={address || 'default'} colors={theme.colors}/>
            </div>
            <div
                className="w-[128px] h-[128px] rounded-full overflow-hidden mt-[-64px] mx-auto border-4 border-white md:hidden">
                <Avatar size={128} name={address || 'default'} colors={theme.colors}/>
            </div>
            <div className="mt-4 flex flex-col items-center md:flex-row">
                <div className="colorful text-4xl font-bold md:mr-5 mb-4 !bg-clip-text"
                     style={{background: theme.text}}>
                    {showAddress(address!)}
                </div>

                <div className="mb-4"><AddressCapsule address={address!} label={'CKT'}/></div>

                {isOwner && internalAddress &&
                    <div className="mb-4"><AddressCapsule address={internalAddress}/></div>
                }
            </div>

            <div className="flex mt-3 md:mt-9">
                <div className="max-w-[624px] flex-1 overflow-auto">
                    <Tabs.Root
                        className="flex flex-col overflow-auto"
                        defaultValue="All" >
                        <Tabs.List className="shrink-0 flex flex-row overflow-auto" aria-label="Assets">
                            <Tabs.Trigger
                                className="h-10 mr-4 font-bold outline-none cursor-pointer py-2 px-4 rounded-lg data-[state=active]:text-white data-[state=active]:bg-black"
                                value="All"
                            >
                                All
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                className="h-10 mr-4 font-bold outline-none cursor-pointer py-2 px-4 rounded-lg data-[state=active]:text-white data-[state=active]:bg-black"
                                value="BTC"
                            >
                                BTC
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                className="h-10 mr-4 font-bold outline-none cursor-pointer py-2 px-4 rounded-lg data-[state=active]:text-white data-[state=active]:bg-black"
                                value="DOBs"
                            >
                                DOBs
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                className="h-10 mr-4 font-bold outline-none cursor-pointer py-2 px-4 rounded-lg data-[state=active]:text-white data-[state=active]:bg-black"
                                value="Coins"
                            >
                                Coins
                            </Tabs.Trigger>
                            <Tabs.Trigger
                                className="h-10 mr-4 font-bold outline-none cursor-pointer py-2 px-4 rounded-lg data-[state=active]:text-white data-[state=active]:bg-black"
                                value=".bit"
                            >
                                .bit
                            </Tabs.Trigger>
                        </Tabs.List>


                        <Tabs.Content
                            className="py-4 px-1 grow bg-white rounded-b-md outline-none"
                            value="All"
                        >
                            <ListToken data={tokens} status={tokensStatus} />
                        </Tabs.Content>
                        <Tabs.Content
                            className="py-4 px-1 grow bg-white rounded-b-md outline-none"
                            value="BTC"
                        >
                            BTC
                        </Tabs.Content>
                        <Tabs.Content
                            className="py-4 px-1 grow bg-white rounded-b-md outline-none"
                            value="DOBs"
                        >
                            DOBs
                        </Tabs.Content>
                        <Tabs.Content
                            className="py-4 px-1 grow bg-white rounded-b-md outline-none"
                            value="Coins"
                        >
                            Coins
                        </Tabs.Content>
                        <Tabs.Content
                            className="py-4 px-1 grow bg-white rounded-b-md outline-none"
                            value=".bit"
                        >
                            .bit
                        </Tabs.Content>
                    </Tabs.Root>
                </div>
            </div>
        </div>

    </div>
}
