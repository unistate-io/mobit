import {ChainIcons} from "@/components/TokenIcon/icons"
import {useContext, useEffect, useRef, useState} from "react"
import {shortTransactionHash} from "@/utils/number_display"
import {Link} from "react-router-dom"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import {SporesWithChainInfo} from "@/serves/useSpores"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {getDobPrice, renderDob} from "@/utils/spore"
import {scriptToHash} from "@nervosnetwork/ckb-sdk-utils"
import {hashType} from "@/serves/useXudtTransfer/lib"
import {toDisplay} from "@/utils/number_display"
import {MarketContext} from "@/providers/MarketProvider/MarketProvider"
import BigNumber from "bignumber.js"
// import DialogSporeCreate from "@/components/Dialogs/DialogSporeCreate/DialogSporeCreate"

export default function ListDOBs({
    data,
    onChangePage,
    status,
    loaded,
    onPriceChange
}: {
    data: SporesWithChainInfo[]
    status: string
    loaded: boolean
    onChangePage?: (page: number) => any
    onPriceChange?: (price: number) => any
}) {
    const [page, setPage] = useState<number>(1)
    const {lang} = useContext(LangContext)
    const dobsValue = useRef<number>(0)

    const handlePriceChange = (price: number) => {
        dobsValue.current += price
        onPriceChange && onPriceChange(dobsValue.current)
    }

    return (
        <div className="shadow rounded-lg bg-white py-4">
            <div className="flex justify-between flex-row items-center px-2 md:px-4">
                <div className="text-xl font-semibold">{lang["DOBs"]}</div>
            </div>
            <div className="px-2 md:px-4 mb-3 text-sm text-gray-500">{lang["Non-fungible assets"]}</div>

            <div className="flex flex-col">
                {status === "loading" && (
                    <div className="mx-4 my-2">
                        <div className="loading-bg rounded-lg h-[30px] my-2" />
                        <div className="loading-bg rounded-lg h-[30px] my-2" />
                        <div className="loading-bg rounded-lg h-[30px] my-2" />
                    </div>
                )}

                {data.length === 0 && status !== "loading" && (
                    <div className="mx-4 h-[120px] flex flex-row justify-center items-center bg-gray-100 text-gray-300 rounded-xl">
                        {lang[`No assets found`]}
                    </div>
                )}

                <div className="grid-cols-2 sm:grid-cols-3 grid">
                    {status !== "loading" &&
                        data.map((item, index) => {
                            return <DOBItem item={item} key={item.spore_id} onPriceChange={handlePriceChange} />
                        })}
                </div>

                {!loaded && (
                    <div
                        onClick={() => {
                            setPage(page + 1)
                            onChangePage && onChangePage(page + 1)
                        }}
                        className="cursor-pointer hover:bg-gray-300 bg-gray-200 h-[40px] rounded-lg flex flex-row items-center justify-center mx-4 mt-2 text-xs"
                    >
                        {lang[`View More`]}
                    </div>
                )}
            </div>
        </div>
    )
}

function DOBItem({item, onPriceChange}: {item: SporesWithChainInfo; onPriceChange?: (price: number) => any}) {
    const {currCurrency, rates, currencySymbol} = useContext(MarketContext)

    const [image, setImage] = useState<string | null>(null)
    const [video, setVideo] = useState(null)
    const [name, setName] = useState("")
    const [plantText, setPlantText] = useState("")
    const {network} = useContext(CKBContext)
    const [typeHash, setTypeHash] = useState("")

    const [usdPrice, setUsdPrice] = useState(0)

    const getUsdPrice = async () => {
        if (network !== "mainnet") {
            return 0
        }

        const typeHash = scriptToHash({
            args: item.address_by_type_address_id?.script_args
                ? `0x${item.address_by_type_address_id.script_args.startsWith("\\x") ? item.address_by_type_address_id.script_args.substring(2) : item.address_by_type_address_id.script_args}`
                : "0x",
            codeHash: item.address_by_type_address_id?.script_code_hash
                ? `0x${item.address_by_type_address_id.script_code_hash.startsWith("\\x") ? item.address_by_type_address_id.script_code_hash.substring(2) : item.address_by_type_address_id.script_code_hash}`
                : "0x",
            hashType: hashType[item.address_by_type_address_id?.script_hash_type ?? 0] ?? "type"
        })
        setTypeHash(typeHash)
        const usdPrice = await getDobPrice(typeHash)
        setUsdPrice(usdPrice)
        onPriceChange && onPriceChange(usdPrice)
    }

    const calculatePrice = (price: number) => {
        let value = toDisplay(
            BigNumber("1").times(price.toString()).times(rates[currCurrency.toUpperCase()]).toString(),
            0,
            true,
            4
        )
        return currencySymbol + value
    }

    useEffect(() => {
        ;(async () => {
            const {name, image, plantText} = await renderDob(item, network)
            getUsdPrice()
            setName(name)
            setImage(image)
            setPlantText(plantText)
        })()
    }, [])

    const id = item.spore_id.startsWith('0x') ? item.spore_id.replace("0x", "") : item.spore_id.replace("\\", "").replace("x", "")

    return (
        <Link
            to={`/dob/${id}?chain=${item.chain}`}
            className="box-border p-2"
        >
            <div className="relative w-full sm:h-[240px] h-[180px] overflow-hidden rounded-sm border border-1">
                <img className="object-cover w-full h-full" src={image || "/images/spore_placeholder.svg"} alt="" />
                {!!ChainIcons[item.chain] && (
                    <img
                        src={ChainIcons[item.chain]}
                        alt={item.chain}
                        height={24}
                        width={24}
                        className="absolute top-3 right-3"
                    />
                )}
            </div>
            <div className="mt-1 text-base font-semibold whitespace-nowrap overflow-hidden overflow-ellipsis h-[24px]">
                {name || plantText}
            </div>
            <div className="text-xs">{shortTransactionHash(item.spore_id.replace("\\", "0"))}</div>
            <div className="h-6 flex justify-end w-full flex-row">
                {!!usdPrice && !!typeHash && (
                    <div
                        className="text-xs bg-black text-white py-3 px-2 rounded-md flex flex-row items-center"
                        onClick={e => {
                            e.preventDefault()
                            window.open(`https://omiga.io/info/dobs/${typeHash}`, "_blank")
                        }}
                    >
                        <img src="/images/omiga_logo.png" className="w-4 h-4 mr-1" alt="" />
                        {calculatePrice(usdPrice)}
                    </div>
                )}
            </div>
        </Link>
    )
}
