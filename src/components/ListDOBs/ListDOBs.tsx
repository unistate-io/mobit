import {ChainIcons} from "@/components/TokenIcon/icons"
import {useContext, useEffect, useState} from "react"
import {shortTransactionHash} from "@/utils/number_display"
import {Link} from "react-router-dom"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import {SporesWithChainInfo} from "@/serves/useSpores"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {renderDob} from "@/utils/spore"
import DialogSporeCreate from "@/components/Dialogs/DialogSporeCreate/DialogSporeCreate"

export default function ListDOBs({
    data,
    onChangePage,
    status,
    loaded
}: {
    data: SporesWithChainInfo[]
    status: string
    loaded: boolean
    onChangePage?: (page: number) => any
}) {
    const [page, setPage] = useState<number>(1)
    const {lang} = useContext(LangContext)

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

                {/* Add Create Spore Button */}
                <div className="mx-4 mb-4">
                    <DialogSporeCreate className="w-full">
                        <div className="bg-blue-500 text-white font-semibold px-4 py-3 rounded-lg flex flex-row flex-nowrap justify-center hover:opacity-80">
                            {lang["Create Spore"]}
                        </div>
                    </DialogSporeCreate>
                </div>

                <div className="grid-cols-2 sm:grid-cols-3 grid">
                    {status !== "loading" &&
                        data.map((item, index) => {
                            return <DOBItem item={item} key={item.id} />
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

function DOBItem({item}: {item: SporesWithChainInfo}) {
    const [image, setImage] = useState<string | null>(null)
    const [video, setVideo] = useState(null)
    const [name, setName] = useState("")
    const [plantText, setPlantText] = useState("")
    const {network} = useContext(CKBContext)

    useEffect(() => {
        ;(async () => {
            const {name, image, plantText} = await renderDob(item, network)
            setName(name)
            setImage(image)
            setPlantText(plantText)
        })()
    }, [item])

    return (
        <Link to={`/dob/${item.id.replace("\\", "").replace("x", "")}?chain=${item.chain}`} className="box-border p-2">
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
            <div className="text-xs">{shortTransactionHash(item.id.replace("\\", "0"))}</div>
        </Link>
    )
}
