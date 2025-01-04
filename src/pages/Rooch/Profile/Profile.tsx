import {useParams} from "react-router-dom";
import {useContext, useEffect, useMemo, useState} from "react"
import {RoochContext} from "@/providers/RoochProvider/RoochProvider"
import DialogReceive from "@/components/Dialogs/DialogReceive/DialogReceive"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import Background from "@/components/Background/Background"
import NetWorth from "@/components/NetWorth"
import Avatar from "@/components/Avatar/Avatar"
import ProfileAddresses from "@/components/ProfileAddresses/ProfileAddresses"
import ListToken, {TokenBalance} from "@/components/ListToken/ListToken"
import ListHistory from "@/components/ListHistory/ListHistory"
import ListBtcHistory from "@/components/ListBtcHistory/ListBtcHistory"
import useBtcTransactionsHistory from "@/serves/useBtcTransactionsHistory"
import useLayer1Assets from "@/serves/useLayer1Assets"
import useRoochBalance from "@/serves/useRoochBalance"

export default function RoochProfile() {
    const {address} = useParams()
    const {roochAddress, btcAddress, theme, network} = useContext(RoochContext)
    const {lang} = useContext(LangContext)

    const isOwner = useMemo(() => {
        return address === roochAddress
    }, [address, roochAddress])

    const [activeTab, setActiveTab] = useState<'rooch' | 'btc' >('rooch')

    useEffect(() => {
        if (!btcAddress) {
            setActiveTab('rooch')
        }
    }, [btcAddress])

    const {
        data: btcHistory,
        status: btcHistoryStatus
    } = useBtcTransactionsHistory(network, btcAddress)

    const {
        btc: layer1Btc,
        status: layer1DataStatus,
    } = useLayer1Assets(network, btcAddress, true)


    const {data: roochBalance, status: roochBalanceStatus} = useRoochBalance(address)

    const tokensStatus = useMemo(() => {
        if (roochBalanceStatus === 'loading' || layer1DataStatus === 'loading') {
            return  'loading'
        } else {
            return  'complete'
        }
    }, [layer1DataStatus, roochBalanceStatus])

    const tokenData = useMemo(() => {
        if (tokensStatus === 'loading') {
            return [] as TokenBalance[]
        } else {
            return layer1Btc
                ? [roochBalance!, layer1Btc]
                : [roochBalance!]
        }
    }, [layer1Btc, roochBalance])

    return <div>
        <div className="max-w-[--page-with] mx-auto relative">
            {isOwner && <div className="absolute right-3 top-[12px]">
                <DialogReceive
                    addresses={[roochAddress!, btcAddress!]}>
                    <div
                        className="border rounded-3xl z-10 cursor-pointer px-6 py-1 font-semibold bg-neutral-100 hover:bg-neutral-200 shadow-sm justify-center items-center inline-flex">{lang['Receive']}</div>
                </DialogReceive>
            </div>}
        </div>

        <Background gradient={theme.bg}/>
        <div className="max-w-[--page-with] mx-auto px-3 pb-10 relative">
            <div className="absolute right-3 top-[40px] md:top-[80px]">
                <NetWorth balances={tokenData}/>
            </div>

            <div
                className="w-[200px] h-[200px] rounded-full overflow-hidden mt-[-100px] border-4 border-white hidden md:block">
                <Avatar size={200} name={address || 'default'} colors={theme.colors}/>
            </div>
            <div
                className="w-[128px] h-[128px] rounded-full overflow-hidden mt-[-64px] border-4 border-white md:hidden">
                <Avatar size={128} name={address || 'default'} colors={theme.colors}/>
            </div>
            <div className="mt-4 flex flex-col md:items-center md:flex-row">
                {
                    isOwner ?
                        <>
                            <div className="mb-4 md:mr-6">
                                <ProfileAddresses addresses={[btcAddress!]} defaultAddress={btcAddress!}/>
                            </div>
                            <div className="mb-4">
                                <ProfileAddresses
                                    addresses={[roochAddress!]}
                                    defaultAddress={roochAddress!}/>
                            </div>
                        </> :
                        <div className="mb-4">
                            <ProfileAddresses addresses={[address!]} defaultAddress={address!}/>
                        </div>
                }
            </div>

            <div className="flex flex-row items-center mt-3 lg:mt-9 w-full overflow-auto"></div>
            <div className="flex justify-between flex-col lg:flex-row">
                <div className={`flex-1 lg:max-w-[780px] block`}>
                    <div className={`mt-4 block`}>
                        <ListToken
                            data={tokenData}
                            status={tokensStatus}
                            internalAddress={btcAddress}
                            addresses={isOwner ? [roochAddress!] : undefined}/>
                    </div>
                </div>

                <div className={`lg:max-w-[380px] flex-1 mt-4 block`}>
                    <div className="shadow rounded-lg bg-white py-4">
                        <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
                            <div className="text-xl font-semibold">{lang['Activity']}</div>
                        </div>

                        {!!btcAddress && <div className="flex flex-row items-center px-2">
                            <div onClick={() => {
                                setActiveTab('rooch')
                            }}
                                 className={`select-none cursor-pointer relative h-8 px-4 ${activeTab === 'rooch' ? 'after:content-[\'\'] after:block after:absolute after:h-2 after:w-4 after:bg-[#9EFEDD] after:rounded-full after:left-[50%] after:ml-[-8px]' : ''}`}>
                                Rooch
                            </div>
                            <div onClick={() => {
                                setActiveTab('btc')
                            }}
                                 className={`select-none cursor-pointer relative h-8 px-4 ${activeTab === 'btc' ? 'after:content-[\'\'] after:block after:absolute after:h-2 after:w-4 after:bg-[#9EFEDD] after:rounded-full after:left-[50%] after:ml-[-8px]' : ''}`}>
                                BTC
                            </div>
                        </div>}

                        {activeTab === 'rooch' &&<ListHistory maxShow={5}
                                      addresses={undefined}
                                      data={[]}
                                      status={'complete'}/>
                        }

                        {activeTab === 'btc' && !!btcAddress &&
                            <ListBtcHistory
                                showExplorerLink={true}
                                internalAddress={btcAddress!}
                                data={btcHistory}
                                status={btcHistoryStatus}
                            />
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>
}