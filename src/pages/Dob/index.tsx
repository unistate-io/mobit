import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useContext, useMemo } from "react"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import useSporeDetail from "@/serves/useSporeDetail"
import CopyText from "@/components/CopyText/CopyText"
import { isBtcAddress, shortTransactionHash } from "@/utils/common"
import { CKBContext } from "@/providers/CKBProvider/CKBProvider"
import useLayer1Assets from "@/serves/useLayer1Assets"
import DialogSporeTransfer from "@/components/Dialogs/DialogSporeTransfer/DialogSporeTransfer"
import DialogSporeMelt from "@/components/Dialogs/DialogSporeMelt/DialogSporeMelt"
import { LangContext } from "@/providers/LangProvider/LangProvider"
import { scriptToHash } from "@nervosnetwork/ckb-sdk-utils"
import { hashType } from "@/serves/useXudtTransfer/lib"

export default function DobPage() {
    const { tokenid } = useParams()
    const navigate = useNavigate()

    if (!tokenid) {
        throw new Error("tokenid needed")
    }

    const { status, data } = useSporeDetail(tokenid)
    const { addresses, internalAddress, network } = useContext(CKBContext)
    const { lang } = useContext(LangContext)
    const [searchParams] = useSearchParams()

    const chain = useMemo(() => {
        let chain = searchParams.get("chain")
        if (!chain || (chain !== "ckb" && chain !== "btc")) {
            chain = "ckb"
        }
        return chain
    }, [searchParams])

    const typeHash = useMemo(() => {
        if (data?.address_by_type_address_id?.script_args && data?.address_by_type_address_id?.script_code_hash && data?.address_by_type_address_id?.script_hash_type) {
            return scriptToHash({
                args: data.address_by_type_address_id?.script_args
                    ? `0x${data.address_by_type_address_id.script_args.startsWith("\\x") ? data.address_by_type_address_id.script_args.substring(2) : data.address_by_type_address_id.script_args}`
                    : "0x",
                codeHash: data.address_by_type_address_id?.script_code_hash
                    ? `0x${data.address_by_type_address_id.script_code_hash.startsWith("\\x") ? data.address_by_type_address_id.script_code_hash.substring(2) : data.address_by_type_address_id.script_code_hash}`
                    : "0x",
                hashType: hashType[data.address_by_type_address_id?.script_hash_type ?? 0] ?? "type"
            })
        } else {
            return ""
        }
    }, [data])

    const { dobs, status: l1DataStatus } = useLayer1Assets(
        chain === "btc" && !!internalAddress && isBtcAddress(internalAddress, network === "mainnet")
            ? internalAddress
            : undefined
    )

    const isOwner = useMemo(() => {
        if (!data || !addresses || !addresses.length || !internalAddress) return false

        if (chain === "ckb") {
            return data.owner_address_id ? addresses.includes(data.owner_address_id) : false
        }

        if (chain === "btc" && dobs.length) {
            console.log("dobs", dobs)
            const spore = dobs.find(dob => {
                return dob.spore_id.replace("\\x", "") === tokenid
            })
            return !!spore
        }

        return false
    }, [addresses, internalAddress, data, chain, dobs, tokenid])

    const handleComplete = () => {
        navigate(-1) // 返回上一个页面
    }

    return (
        <div className="max-w-[--page-with] mx-auto px-3 py-8 flex md:flex-row flex-col flex-nowrap items-start mb-10">
            <div className="md:w-[320px] w-full shadow rounded-lg overflow-hidden shrink-0">
                <div className="w-full h-[320px] relative">
                    <img
                        className="w-full h-full object-cover"
                        src={data?.details.image || "https://explorer.nervos.org/images/spore_placeholder.svg"}
                        alt=""
                    />
                </div>
                <div className="p-4">
                    {status === "loading" && l1DataStatus === "loading" && (
                        <>
                            <div className={"loading-bg h-[30px] mb-3 rounded-lg"} />
                            <div className={"loading-bg h-[30px] mb-3 rounded-lg"} />
                        </>
                    )}

                    {status !== "loading" && !!data && (
                        <>
                            <div className="font-semibold text-lg mb-3">
                                {data.is_burned && 
                                    <div className="mr-3 bg-red-500 text-white text-xs px-2 rounded-md shadow-sm inline-flex flex-row items-center">
                                        <i className="uil-info-circle mr-1 text-base" />
                                        {lang["Melted"]}
                                    </div>
                                }
                                {data.details.name || data.details.plantText || ""}
                               
                            </div>

                            <div className="flex flex-row justify-between text-sm">
                                {data.details.description || data.details.plantText || ""}
                            </div>
                        </>
                    )}

                    {isOwner && chain !== "btc" && !!data && !data.is_burned && (
                        <div className="mt-3">
                            <DialogSporeTransfer spore={data} className="w-full" onComplete={handleComplete}>
                                <div className="cursor-pointer px-4 py-3 font-semibold bg-neutral-100 hover:bg-neutral-200 rounded-md shadow-sm justify-center items-center flex">
                                    {lang["Transfer"]}
                                </div>
                            </DialogSporeTransfer>
                            <div className="mt-3">
                                <DialogSporeMelt spore={data} className="w-full" onComplete={handleComplete} cover={data.details.image}>
                                    <div className="text-red-500 bg-neutral-100 font-semibold px-4 py-3 rounded-lg flex flex-row flex-nowrap justify-center hover:opacity-80">
                                        {lang["Melt"]}
                                    </div>
                                </DialogSporeMelt>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="shadow flex-1 md:ml-6 rounded-lg px-5 py-3 w-full mt-4 md:mt-0">
                <div className="font-semibold text-lg mb-4">{lang["Information"]}</div>

                {status === "loading" && (
                    <>
                        <div className={"loading-bg h-[45px] mb-6 rounded-lg"} />
                        <div className={"loading-bg h-[45px] mb-6 rounded-lg w-[80%]"} />
                        <div className={"loading-bg h-[45px] mb-6 rounded-lg"} />
                        <div className={"loading-bg h-[45px] mb-6 rounded-lg w-[80%]"} />
                        <div className={"loading-bg h-[45px] mb-6 rounded-lg"} />
                        <div className={"loading-bg h-[45px] mb-6 rounded-lg w-[80%]"} />
                        <div className={"loading-bg h-[45px] mb-6 rounded-lg"} />
                        <div className={"loading-bg h-[45px] mb-6 rounded-lg w-[80%]"} />
                    </>
                )}

                {status !== "loading" && data && (
                    <>
                        <div className="text-sm mb-6">
                            <div className="text-sm mb-3">{lang["Chain"]}</div>
                            <div className="flex flex-row items-center text-sm font-semibold">
                                <TokenIcon symbol={chain === "ckb" ? "CKB" : "BTC"} size={24} />
                                {chain.toUpperCase()}
                            </div>
                        </div>

                        <div className="text-sm mb-6">
                            <div className="text-sm mb-3">{lang["Type"]}</div>
                            <div className="flex flex-row items-center text-sm font-semibold break-all">
                                {data.content_type}
                            </div>
                        </div>

                        <div className="text-sm mb-6">
                            <div className="text-sm mb-3">{lang["Token ID"]}</div>
                            <div
                                className="flex flex-row items-center text-sm font-semibold break-all"
                                title={`0x${tokenid}`}
                            >
                                <CopyText copyText={`0x${tokenid}`}>
                                    {shortTransactionHash(`0x${tokenid}`, 10)}
                                </CopyText>
                            </div>
                        </div>

                        {!!typeHash &&
                            <div className="text-sm mb-6">
                                <div className="text-sm mb-3">{lang["Type Hash"]}</div>
                                <div
                                    className="flex flex-row items-center text-sm font-semibold break-all"
                                    title={typeHash}
                                >
                                    <CopyText copyText={typeHash}>
                                        {shortTransactionHash(typeHash, 10)}
                                    </CopyText>
                                </div>
                            </div>
                        }

                        <div className="text-sm mb-6">
                            <div className="text-sm mb-3">{lang["Owner"]}</div>
                            <div
                                className="flex flex-row items-center text-sm font-semibold break-all"
                                title={data.owner_address_id ? `0x${data.owner_address_id}` : ""}
                            >
                                <CopyText copyText={data.owner_address_id || ""}>
                                    {shortTransactionHash(data.owner_address_id || "", 10)}
                                </CopyText>
                            </div>

                            {isOwner && chain === "btc" && (
                                <div className="flex flex-row items-center text-sm font-semibold break-all">
                                    <CopyText copyText={internalAddress!}>
                                        {shortTransactionHash(internalAddress!, 10)}
                                    </CopyText>
                                </div>
                            )}
                        </div>

                        {data.cluster_id && (
                            <div className="text-sm mb-6">
                                <div className="text-sm mb-3">{lang["Cluster"]} ID</div>
                                <div
                                    className="flex flex-row items-center text-sm font-semibold break-all"
                                    title={"0" + data.cluster_id.replace("\\", "")}
                                >
                                    <CopyText copyText={"0" + data.cluster_id.replace("\\", "")}>
                                        {shortTransactionHash("0" + data.cluster_id.replace("\\", ""), 10)}
                                    </CopyText>
                                </div>
                            </div>
                        )}

                        {!!data.details.traits.length && (
                            <>
                                {!!data.details.dna && (
                                    <div className="text-sm mb-6">
                                        <div className="text-sm mb-3">DNA</div>
                                        <div className="flex flex-row items-center text-sm font-semibold break-all">
                                            {" "}
                                            {data.details.dna}
                                        </div>
                                    </div>
                                )}

                                {!!data.details.id && (
                                    <div className="text-sm mb-6">
                                        <div className="text-sm mb-3">ID</div>
                                        <div className="flex flex-row items-center text-sm font-semibold break-all">
                                            {" "}
                                            {data.details.id}
                                        </div>
                                    </div>
                                )}

                                {!!data.details.traits.length && (
                                    <div className="text-sm mb-6">
                                        <div className="text-sm mb-3">{lang["Traits"]}</div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {data.details.traits.map((traits, index) => {
                                                return (
                                                    <div className="rounded-lg bg-gray-100 text-xs p-3" key={index}>
                                                        <div className="mb-2 text-gray-400 text-center">
                                                            {traits.key}
                                                        </div>
                                                        <div className="text-center text-sm font-semibold break-all whitespace-nowrap overflow-hidden overflow-ellipsis">
                                                            {traits.value}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            <div></div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {status === "complete" && !data && (
                    <div className="rounded flex flex-row items-center justify-center h-[280px] bg-gray-100 font-semibold text-gray-400">
                        {lang["No data to show"]}
                    </div>
                )}
            </div>
        </div>
    )
}
