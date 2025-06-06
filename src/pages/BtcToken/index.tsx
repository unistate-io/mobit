import {useContext, useMemo, useState} from "react"
import {TokenInfo} from "@/utils/graphql/types"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {toDisplay} from "@/utils/number_display"
import useBtcTransactionsHistory from "@/serves/useBtcTransactionsHistory"
import useLayer1Assets from "@/serves/useLayer1Assets"
import ListBtcTokenHistory from "@/components/ListBtcTokenHistory/ListBtcTokenHistory"
import {LangContext} from "@/providers/LangProvider/LangProvider"

const BtcInfo: TokenInfo = {
    decimal: 8,
    name: "Bitcoin",
    symbol: "BTC",
    defining_tx_hash: "",
    defining_output_index: 0,
    type_address_id: "",
    block_number: "",
    tx_timestamp: ""
}

export default function BitcoinPage() {
    const {signer, internalAddress} = useContext(CKBContext)

    const btcAddress = useMemo(() => {
        if (!internalAddress) {
            return undefined
        }

        if (internalAddress.startsWith("bc") || internalAddress.startsWith("tb")) {
            return internalAddress
        }

        return undefined
    }, [internalAddress])

    const [tokenInfo] = useState(BtcInfo)
    const {btc, status: btcBalanceStatue} = useLayer1Assets(btcAddress)
    const {data: historyData, status: historyDataStatus} = useBtcTransactionsHistory(btcAddress)
    const {lang} = useContext(LangContext)

    return (
        <div className="max-w-[--page-with] mx-auto px-3 py-8 flex flex-col sm:flex-row items-start mb-10">
            <div className="sm:w-[320px] w-full shadow rounded-lg overflow-hidden bg-[url('./assets/token_bg.png')] bg-[length:100%_auto] bg-no-repeat p-5">
                <div className="mt-10 mb-4">
                    <TokenIcon symbol={tokenInfo?.symbol || "default"} size={90} />
                </div>
                <div className="text-lg mb-4 flex flex-row items-baseline">
                    <div className="font-semibold mr-3 text-2xl"> {tokenInfo.symbol}</div>
                    <div className="text-sm"> {tokenInfo.name}</div>
                </div>

                {signer && !!btcAddress && (
                    <>
                        {btcBalanceStatue === "loading" && <div className={"loading-bg h-[30px] mb-3 rounded-lg"} />}

                        {btcBalanceStatue === "complete" && (
                            <div className={"flex flex-col justify-between mb-3"}>
                                <div>{lang["Balance"]}</div>
                                <div className="font-semibold">{toDisplay(btc?.amount || "0", 8, true, 8)} BTC</div>
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="shadow flex-1 w-full mt-6 sm:mt-0 sm:ml-6 rounded-lg px-5 py-3">
                <div className="font-semibold text-lg mb-4">{lang["Transactions"]}</div>

                <ListBtcTokenHistory data={historyData} status={historyDataStatus} address={btcAddress} />
            </div>
        </div>
    )
}
