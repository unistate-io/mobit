import {UserContext} from "@/providers/UserProvider/UserProvider"
import {useContext, useEffect, useMemo, useState} from "react"
import Background from "@/components/Background/Background"
import Avatar from "@/components/Avatar/Avatar"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import * as Tabs from "@radix-ui/react-tabs"
import ListToken, {TokenBalance} from "@/components/ListToken/ListToken"
import useAllXudtBalance from "@/serves/useAllXudtBalance"
import useCkbBalance from "@/serves/useCkbBalance"
import {ToastContext, ToastType} from "@/providers/ToastProvider/ToastProvider"
import useTransactions from "@/serves/useTransactionsHistory"
import ListHistory from "@/components/ListHistory/ListHistory"
import useSpores from "@/serves/useSpores"
import ListDOBs from "@/components/ListDOBs/ListDOBs"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import useLayer1Assets from "@/serves/useLayer1Assets"
import ProfileAddresses from "@/components/ProfileAddresses/ProfileAddresses"
import useBtcTransactionsHistory from "@/serves/useBtcTransactionsHistory"
import ListBtcHistory from "@/components/ListBtcHistory/ListBtcHistory"
import Button from "@/components/Form/Button/Button"

export default function EvmProfile({internalAddress}: {internalAddress: string}) {
    const {address, theme, isOwner} = useContext(UserContext)
    const {addresses} = useContext(CKBContext)
    const {showToast} = useContext(ToastContext)
    const {lang} = useContext(LangContext)

    // ui state
    const [selectedAddress, setSelectedAddress] = useState<string | undefined>(address)
    const [activeTab, setActiveTab] = useState<"ckb" | "btc">("ckb")

    useEffect(() => {
        if (!internalAddress) {
            setActiveTab("ckb")
        }
    }, [internalAddress])

    const queryAddress = useMemo(() => {
        if (!!addresses && addresses?.includes(address!)) {
            return addresses
        }

        return [address!]
    }, [address, addresses])

    const {data: xudtData, status: xudtDataStatus, error: xudtDataErr} = useAllXudtBalance(queryAddress)
    const {data: ckbData, status: ckbDataStatus, error: ckbDataErr} = useCkbBalance(queryAddress)
    const {
        data: historyData,
        status: historyDataStatus,
        page: historyDataPage,
        setPage: setHistoryDataPage,
        loadAll: historyDataLoadAll
    } = useTransactions(selectedAddress!)
    const {
        data: sporesData,
        status: sporesDataStatus,
        loaded: sporesDataLoaded,
        setPage: setSporesDataPage
    } = useSpores(queryAddress)

    const tokensStatus = useMemo(() => {
        if (xudtDataStatus === "loading" || ckbDataStatus === "loading") {
            return "loading"
        } else if (xudtDataStatus === "error" || ckbDataStatus === "error") {
            return "error"
        } else if (xudtDataStatus === "complete" && ckbDataStatus === "complete" && ckbData) {
            return "complete"
        }

        return "loading"
    }, [xudtDataStatus, ckbDataStatus, ckbData])

    const dobsListStatue = useMemo(() => {
        if (sporesDataStatus === "loading") {
            return "loading"
        } else if (sporesDataStatus === "error") {
            return "error"
        } else if (sporesDataStatus === "complete") {
            return "complete"
        }

        return "loading"
    }, [sporesDataStatus])

    const tokenData = useMemo(() => {
        if (tokensStatus === "loading" || tokensStatus === "error") {
            return [] as TokenBalance[]
        } else {
            return [ckbData!, ...xudtData]
        }
    }, [ckbData, tokensStatus, xudtData])

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

    const tabs = useMemo(() => {
        return [
            {
                value: "All",
                label: lang["All"]
            },
            {
                value: "Tokens",
                label: lang["Tokens"]
            },
            {
                value: "DOBs",
                label: lang["DOBs"]
            },
            {
                value: "Activity",
                label: lang["Activity"]
            }
        ]
    }, [lang])

    const [currtab, setCurrTab] = useState("All")

    return (
        <div>
            <Background gradient={theme.bg} />
            <div className="max-w-[--page-with] mx-auto px-3 pb-10">
                <div className="w-[200px] h-[200px] rounded-full overflow-hidden mt-[-100px] border-4 border-white hidden md:block">
                    <Avatar size={200} name={address || "default"} colors={theme.colors} />
                </div>
                <div className="w-[128px] h-[128px] rounded-full overflow-hidden mt-[-64px] mx-auto border-4 border-white md:hidden">
                    <Avatar size={128} name={address || "default"} colors={theme.colors} />
                </div>
                <div className="mt-4 flex flex-col items-center md:flex-row">
                    <div className="mb-4 md:mr-6">
                        <ProfileAddresses addresses={[internalAddress!]} defaultAddress={internalAddress!} />
                    </div>
                    <div className="mb-4">
                        <ProfileAddresses
                            onChoose={e => {
                                setSelectedAddress(e)
                            }}
                            addresses={queryAddress}
                            defaultAddress={address!}
                        />
                    </div>
                </div>

                <div className="flex flex-row items-center mt-3 lg:mt-9 w-full overflow-auto">
                    {tabs.map(tab => {
                        return (
                            <Button
                                key={tab.value}
                                onClick={() => setCurrTab(tab.value)}
                                className={`!w-auto bg-white h-10 !font-bold outline-none cursor-pointer py-2 px-4 rounded-lg ${tab.value === currtab ? " text-white !bg-black" : ""}`}
                                value={tab.value}
                            >
                                {tab.label}
                            </Button>
                        )
                    })}
                </div>
                <div className="flex justify-between flex-col lg:flex-row">
                    <div className={`flex-1 lg:max-w-[780px] ${currtab !== "Activity" ? "block" : "hidden"}`}>
                        <div className={`mt-4 ${currtab === "All" || currtab === "Tokens" ? "block" : "hidden"}`}>
                            <ListToken
                                data={tokenData}
                                status={tokensStatus}
                                internalAddress={internalAddress}
                                addresses={isOwner ? addresses : undefined}
                            />
                        </div>

                        <div className={`mt-6 ${currtab === "All" || currtab === "DOBs" ? "block" : "hidden"}`}>
                            <ListDOBs
                                data={sporesData}
                                status={dobsListStatue}
                                loaded={sporesDataLoaded}
                                onChangePage={page => {
                                    setSporesDataPage(page)
                                }}
                            />
                        </div>
                    </div>
                    <div className={`w-full mt-4 ${currtab === "Activity" ? "block" : "hidden"}`}>
                        <div className="shadow rounded-lg bg-white py-4">
                            <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
                                <div className="text-xl font-semibold">{lang["Activity"]}</div>
                            </div>
                            <ListHistory
                                page={historyDataPage}
                                loadAll={historyDataLoadAll}
                                onNextPage={() => {
                                    setHistoryDataPage(historyDataPage + 1)
                                }}
                                addresses={queryAddress}
                                data={historyData}
                                status={historyDataStatus}
                            />
                        </div>
                    </div>

                    <div className={`lg:max-w-[380px] flex-1 mt-4 ${currtab !== "Activity" ? "block" : "hidden"}`}>
                        <div className="shadow rounded-lg bg-white py-4">
                            <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
                                <div className="text-xl font-semibold">{lang["Activity"]}</div>
                            </div>
                            {activeTab === "ckb" && (
                                <ListHistory
                                    maxShow={5}
                                    addresses={queryAddress}
                                    data={historyData}
                                    status={historyDataStatus}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
