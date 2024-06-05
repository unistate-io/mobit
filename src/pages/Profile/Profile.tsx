import {UserContext} from '@/providers/UserProvider/UserProvider'
import {useContext, useEffect, useState} from "react";
import Background from "@/components/Background/Background";
import Avatar from "@/components/Avatar/Avatar";
import AddressCapsule from "@/components/AddressCapsule/AddressCapsule";
import {CKBContext} from "@/providers/CKBProvider/CKBProvider";
import * as Tabs from '@radix-ui/react-tabs';
import ListToken, {TokenBalance} from "@/components/ListToken/ListToken";
import useXudtBalance from "@/serves/useXudtBalance";
import useCkbBalance from "@/serves/useCkbBalance";
import {ToastContext, ToastType} from "@/providers/ToastProvider/ToastProvider";
import useTransactions from "@/serves/useTransactionsHistory";
import ListHistory from "@/components/ListHistory/ListHistory";
import useSpores from "@/serves/useSpores";
import ListDOBs from "@/components/ListDOBs/ListDOBs";
import DialogCkbTransfer from "@/components/Dialogs/DialogCkbTransfer/DialogCkbTransfer";

const tabs = ['All', 'Tokens', 'DOBs']

export default function Profile() {
    const {address, isOwner, theme} = useContext(UserContext)
    const {internalAddress, signer} = useContext(CKBContext)
    const {showToast} = useContext(ToastContext)

    const {data: xudtData, status: xudtDataStatus, error: xudtDataErr} = useXudtBalance(address!)
    const {data: ckbData, status: ckbDataStatus, error: ckbDataErr} = useCkbBalance(address!)
    const {data: historyData, status: historyDataStatus} = useTransactions(address!)
    const {
        data: sporesData,
        status: sporesDataStatus,
        loaded: sporesDataLoaded,
        setPage: setSporesDataPage
    } = useSpores(address!)

    const [tokens, setTokens] = useState<TokenBalance[]>([])
    const [tokensStatus, setTokensStatus] = useState<string>('loading')

    useEffect(() => {
        if (xudtDataStatus === 'loading' || ckbDataStatus === 'loading') {
            setTokens([])
            setTokensStatus('loading')
        } else if (xudtDataStatus === 'error' || ckbDataStatus === 'error') {
            setTokensStatus('error')
            setTokens([])
        } else if (xudtDataStatus === 'complete' && ckbDataStatus === 'complete' && ckbData) {
            setTokens([ckbData, ...xudtData])
            setTokensStatus('complete')
        }
    }, [xudtData, xudtDataStatus, ckbData, ckbDataStatus])

    useEffect(() => {
        if (xudtDataErr) {
            console.error(xudtDataErr)
            showToast(xudtDataErr.message, ToastType.error)
        }

        if (ckbDataErr) {
            console.error(ckbDataErr)
            showToast(ckbDataErr.message, ToastType.error)
        }
    }, [xudtDataErr, ckbDataErr])


    return <div>
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
                <div className="mb-4"><AddressCapsule address={address!} /></div>

                {isOwner && internalAddress &&
                    <div className="mb-4"><AddressCapsule address={internalAddress}/></div>
                }
            </div>

            <div className="flex mt-3 lg:mt-9 justify-between flex-col lg:flex-row">
                <div className="flex-1 overflow-auto lg:max-w-[624px]">
                    <Tabs.Root
                        className="flex flex-col overflow-auto"
                        defaultValue="All">
                        <Tabs.List className="shrink-0 flex flex-row overflow-auto" aria-label="Assets">
                            {
                                tabs.map((tab) => <Tabs.Trigger key={tab}
                                                                className="h-10 mr-4 font-bold outline-none cursor-pointer py-2 px-4 rounded-lg data-[state=active]:text-white data-[state=active]:bg-black"
                                                                value={tab}>{tab}</Tabs.Trigger>)
                            }
                        </Tabs.List>


                        <Tabs.Content
                            className="py-4 px-1 grow bg-white rounded-b-md outline-none"
                            value="All" >
                            <ListToken data={tokens} status={tokensStatus} address={signer ? address : undefined} />
                            <div className="mt-6">
                                <ListDOBs
                                    data={sporesData}
                                    status={sporesDataStatus}
                                    loaded={sporesDataLoaded}
                                    onChangePage={(page) => {
                                        setSporesDataPage(page)
                                    }}/>
                            </div>
                        </Tabs.Content>
                        <Tabs.Content
                            className="py-4 px-1 grow bg-white rounded-b-md outline-none"
                            value="Tokens"
                        >
                            <ListToken data={tokens} status={tokensStatus} address={signer ? address : undefined}/>
                        </Tabs.Content>
                        <Tabs.Content
                            className="py-4 px-1 grow bg-white rounded-b-md outline-none"
                            value="DOBs"
                        >
                            <ListDOBs
                                data={sporesData}
                                status={sporesDataStatus}
                                loaded={sporesDataLoaded}
                                onChangePage={(page) => {
                                    setSporesDataPage(page)
                                }}/>
                        </Tabs.Content>

                    </Tabs.Root>
                </div>

                <div className="lg:max-w-[380px] flex-1 lg:ml-4 lg:pt-[56px]">
                    <ListHistory address={address!} data={historyData} status={historyDataStatus}/>
                </div>
            </div>
        </div>
    </div>
}
