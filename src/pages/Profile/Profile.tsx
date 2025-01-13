import {UserContext} from "@/providers/UserProvider/UserProvider"
import {useContext, useEffect, useMemo, useState} from "react"
import Background from "@/components/Background/Background"
import Avatar from "@/components/Avatar/Avatar"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import ListToken, {TokenBalance} from "@/components/ListToken/ListToken"
import useAllXudtBalance from "@/serves/useAllXudtBalance"
import useCkbBalance from "@/serves/useCkbBalance"
import {ToastContext, ToastType} from "@/providers/ToastProvider/ToastProvider"
import useTransactions from "@/serves/useTransactionsHistory"
import useTransactionsHistory from "@/serves/useTransactionsHistory"
import ListHistory from "@/components/ListHistory/ListHistory"
import useSpores from "@/serves/useSpores"
import ListDOBs from "@/components/ListDOBs/ListDOBs"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import useLayer1Assets from "@/serves/useLayer1Assets"
import ProfileAddresses from "@/components/ProfileAddresses/ProfileAddresses"
import useBtcTransactionsHistory from "@/serves/useBtcTransactionsHistory"
import ListBtcHistory from "@/components/ListBtcHistory/ListBtcHistory"
import {isBtcAddress} from "@/utils/common"
import useDotbit from "@/serves/useDotbit"
import ListDotBit from "@/components/ListDotBit/ListDotBit"
import DialogReceive from "@/components/Dialogs/DialogReceive/DialogReceive"
import {Link} from "react-router-dom"
import NetWorth from "@/components/NetWorth"
import Button from "@/components/Form/Button/Button"

export default function Profile() {
    const {address, isOwner, theme} = useContext(UserContext)
    const {internalAddress, addresses, network} = useContext(CKBContext)
    const {showToast} = useContext(ToastContext)
    const {lang} = useContext(LangContext)

    // ui state
    const [selectedAddress, setSelectedAddress] = useState<string | undefined>(address)
    const [activeTab, setActiveTab] = useState<"ckb" | "btc" | "rgbpp" | ".bit">("ckb")

    useEffect(() => {
        if (!internalAddress) {
            setActiveTab("ckb")
        }
    }, [internalAddress])

    const btcAddress = useMemo(() => {
        if (!internalAddress) {
            return undefined
        }

        if (!addresses?.includes(address!)) {
            return undefined
        }

        return isBtcAddress(internalAddress, network === "mainnet") ? internalAddress : undefined
    }, [internalAddress, address, addresses])

    const queryAddress = useMemo(() => {
        return !!addresses && addresses.includes(address!) ? addresses : [address!]
    }, [addresses, address])

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
    const {
        xudts: layer1Xudt,
        dobs: layer1Dobs,
        btc: layer1Btc,
        status: layer1DataStatus,
        error: layer1DataErr
    } = useLayer1Assets(btcAddress, true)

    const {data: btcHistory, status: btcHistoryStatus} = useBtcTransactionsHistory(btcAddress)

    const {
        data: rgbppHistory,
        status: rgbppHistoryStatus,
        setPage: rgbppHistorySetPage,
        page: rgbppHistoryPage,
        loadAll: rgbppHistoryLoadAll
    } = useTransactionsHistory(btcAddress)

    const {domains, status: domainStatus} = useDotbit(address)

    const tokensStatus = useMemo(() => {
        if (xudtDataStatus === "loading" || ckbDataStatus === "loading" || layer1DataStatus === "loading") {
            return "loading"
        } else if (xudtDataStatus === "error" || ckbDataStatus === "error" || layer1DataStatus === "error") {
            return "error"
        } else if (xudtDataStatus === "complete" && ckbDataStatus === "complete" && ckbData) {
            return "complete"
        }

        return "loading"
    }, [xudtDataStatus, ckbDataStatus, layer1DataStatus, ckbData])

    const dobsListStatue = useMemo(() => {
        if (layer1DataStatus === "loading" || sporesDataStatus === "loading") {
            return "loading"
        } else if (layer1DataStatus === "error" || sporesDataStatus === "error") {
            return "error"
        } else if (layer1DataStatus === "complete" && sporesDataStatus === "complete") {
            return "complete"
        }

        return "loading"
    }, [layer1DataStatus, sporesDataStatus])

    const tokenData = useMemo(() => {
        if (tokensStatus === "loading" || tokensStatus === "error") {
            return [] as TokenBalance[]
        } else {
            return layer1Btc
                ? [ckbData!, ...xudtData, layer1Btc, ...layer1Xudt]
                : [ckbData!, ...xudtData, ...layer1Xudt]
        }
    }, [ckbData, layer1Btc, layer1Xudt, tokensStatus, xudtData])

    useEffect(() => {
        if (xudtDataErr) {
            console.error(xudtDataErr)
            showToast(xudtDataErr.message, ToastType.error)
        }

        if (ckbDataErr) {
            console.error(ckbDataErr)
            showToast(ckbDataErr.message, ToastType.error)
        }

        if (layer1DataErr) {
            console.error("layer1DataErr", layer1DataErr)
            showToast(layer1DataErr.message, ToastType.error)
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
                value: ".bit",
                label: ".bit"
            }
        ]
    }, [lang])

    const [currtab, setCurrTab] = useState("All")

    return (
        <div>
            <div className="max-w-[--page-with] mx-auto relative">
                {!!addresses && !!addresses.length && !!internalAddress && isOwner && (
                    <div className="absolute right-3 top-[12px]">
                        <Link
                            to="/trade"
                            className="mr-4 border rounded-3xl z-10 cursor-pointer px-6 py-1 font-semibold bg-neutral-100 hover:bg-neutral-200 shadow-sm justify-center items-center inline-flex"
                        >
                            Swap
                        </Link>
                        <DialogReceive
                            addresses={
                                addresses.includes(internalAddress) ? addresses : [...addresses, internalAddress]
                            }
                        >
                            <div className="border rounded-3xl z-10 cursor-pointer px-6 py-1 font-semibold bg-neutral-100 hover:bg-neutral-200 shadow-sm justify-center items-center inline-flex">
                                {lang["Receive"]}
                            </div>
                        </DialogReceive>
                    </div>
                )}
            </div>
            <Background gradient={theme.bg} />
            <div className="max-w-[--page-with] mx-auto px-3 pb-10 relative">
                <div className="absolute right-3 top-[40px] md:top-[80px]">
                    <NetWorth balances={tokenData} />
                </div>

                <div className="w-[200px] h-[200px] rounded-full overflow-hidden mt-[-100px] border-4 border-white hidden md:block">
                    <Avatar size={200} name={address || "default"} colors={theme.colors} />
                </div>
                <div className="w-[128px] h-[128px] rounded-full overflow-hidden mt-[-64px] border-4 border-white md:hidden">
                    <Avatar size={128} name={address || "default"} colors={theme.colors} />
                </div>
                <div className="mt-4 flex flex-col md:items-center md:flex-row">
                    {isOwner && internalAddress && internalAddress !== address && addresses ? (
                        <>
                            <div className="mb-4 md:mr-6">
                                <ProfileAddresses addresses={[internalAddress!]} defaultAddress={internalAddress!} />
                            </div>
                            <div className="mb-4">
                                <ProfileAddresses
                                    onChoose={e => {
                                        setSelectedAddress(e)
                                    }}
                                    addresses={addresses}
                                    defaultAddress={address!}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="mb-4">
                            <ProfileAddresses addresses={[address!]} defaultAddress={address!} />
                        </div>
                    )}
                </div>

                <div className="flex flex-row items-center mt-3 lg:mt-9 w-full overflow-auto whitespace-nowrap">
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
                    <a
                        href="https://www.nervdao.com/"
                        target="_blank"
                        className="whitespace-nowrap !w-auto bg-white h-10 !font-bold outline-none cursor-pointer py-2 px-4 rounded-lg"
                    >
                        Nervos DAO ({lang["CKB Staking"]})
                    </a>
                    <Button
                        key={"Activity"}
                        onClick={() => setCurrTab("Activity")}
                        className={`!w-auto bg-white h-10 !font-bold outline-none cursor-pointer py-2 px-4 rounded-lg ${"Activity" === currtab ? " text-white !bg-black" : ""}`}
                        value={"Activity"}
                    >
                        {lang["Activity"]}
                    </Button>
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
                                data={[...layer1Dobs, ...sporesData]}
                                status={dobsListStatue}
                                loaded={sporesDataLoaded}
                                onChangePage={page => {
                                    setSporesDataPage(page)
                                }}
                            />
                        </div>

                        <div className={`mt-6 ${currtab === "All" || currtab === ".bit" ? "block" : "hidden"}`}>
                            <ListDotBit data={domains} status={domainStatus} />
                        </div>
                    </div>

                    <div className={`w-full mt-4 ${currtab === "Activity" ? "block" : "hidden"}`}>
                        <div className="shadow rounded-lg bg-white py-4">
                            <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
                                <div className="text-xl font-semibold">{lang["Activity"]}</div>
                            </div>
                            {!!internalAddress && btcAddress && (
                                <div className="flex flex-row items-center px-2">
                                    <div
                                        onClick={() => {
                                            setActiveTab("ckb")
                                        }}
                                        className={`select-none cursor-pointer relative h-8 px-4 ${activeTab === "ckb" ? "after:content-[''] after:block after:absolute after:h-2 after:w-4 after:bg-[#9EFEDD] after:rounded-full after:left-[50%] after:ml-[-8px]" : ""}`}
                                    >
                                        CKB
                                    </div>
                                    <div
                                        onClick={() => {
                                            setActiveTab("btc")
                                        }}
                                        className={`select-none cursor-pointer relative h-8 px-4 ${activeTab === "btc" ? "after:content-[''] after:block after:absolute after:h-2 after:w-4 after:bg-[#9EFEDD] after:rounded-full after:left-[50%] after:ml-[-8px]" : ""}`}
                                    >
                                        BTC
                                    </div>
                                    <div
                                        onClick={() => {
                                            setActiveTab("rgbpp")
                                        }}
                                        className={`select-none cursor-pointer relative h-8 px-4 ${activeTab === "rgbpp" ? "after:content-[''] after:block after:absolute after:h-2 after:w-4 after:bg-[#9EFEDD] after:rounded-full after:left-[50%] after:ml-[-8px]" : ""}`}
                                    >
                                        RGB++
                                    </div>
                                </div>
                            )}

                            {activeTab === "ckb" && (
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
                            )}

                            {activeTab === "btc" && btcAddress && (
                                <ListBtcHistory
                                    showExplorerLink={true}
                                    internalAddress={internalAddress!}
                                    data={btcHistory}
                                    status={btcHistoryStatus}
                                />
                            )}

                            {activeTab === "rgbpp" && btcAddress && (
                                <ListHistory
                                    internalAddress={internalAddress!}
                                    data={rgbppHistory}
                                    status={rgbppHistoryStatus}
                                    page={rgbppHistoryPage}
                                    onNextPage={() => {
                                        rgbppHistorySetPage(rgbppHistoryPage + 1)
                                    }}
                                    loadAll={rgbppHistoryLoadAll}
                                />
                            )}
                        </div>
                    </div>

                    <div
                        className={`lg:max-w-[380px] flex-1 lg:ml-5 mt-4 ${currtab !== "Activity" ? "block" : "hidden"}`}
                    >
                        <div className="shadow rounded-lg bg-white py-4">
                            <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
                                <div className="text-xl font-semibold">{lang["Activity"]}</div>
                            </div>
                            {!!internalAddress && btcAddress && (
                                <div className="flex flex-row items-center px-2">
                                    <div
                                        onClick={() => {
                                            setActiveTab("ckb")
                                        }}
                                        className={`select-none cursor-pointer relative h-8 px-4 ${activeTab === "ckb" ? "after:content-[''] after:block after:absolute after:h-2 after:w-4 after:bg-[#9EFEDD] after:rounded-full after:left-[50%] after:ml-[-8px]" : ""}`}
                                    >
                                        CKB
                                    </div>
                                    <div
                                        onClick={() => {
                                            setActiveTab("btc")
                                        }}
                                        className={`select-none cursor-pointer relative h-8 px-4 ${activeTab === "btc" ? "after:content-[''] after:block after:absolute after:h-2 after:w-4 after:bg-[#9EFEDD] after:rounded-full after:left-[50%] after:ml-[-8px]" : ""}`}
                                    >
                                        BTC
                                    </div>
                                    <div
                                        onClick={() => {
                                            setActiveTab("rgbpp")
                                        }}
                                        className={`select-none cursor-pointer relative h-8 px-4 ${activeTab === "rgbpp" ? "after:content-[''] after:block after:absolute after:h-2 after:w-4 after:bg-[#9EFEDD] after:rounded-full after:left-[50%] after:ml-[-8px]" : ""}`}
                                    >
                                        RGB++
                                    </div>
                                </div>
                            )}

                            {activeTab === "ckb" && (
                                <ListHistory
                                    maxShow={5}
                                    addresses={queryAddress}
                                    data={historyData}
                                    status={historyDataStatus}
                                />
                            )}

                            {activeTab === "btc" && btcAddress && (
                                <ListBtcHistory
                                    pageSize={5}
                                    internalAddress={internalAddress!}
                                    data={btcHistory}
                                    status={btcHistoryStatus}
                                />
                            )}

                            {activeTab === "rgbpp" && btcAddress && (
                                <ListHistory
                                    internalAddress={internalAddress!}
                                    data={rgbppHistory}
                                    status={rgbppHistoryStatus}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
