import { useState } from "react"
import { TokenBalance } from "./ListTokenBtcChain"
import ListTokenBtcChain from "./ListTokenBtcChain"
import ListTokenCkbChain from "./ListTokenCkbChain"
import ListTokenEvmChain from "./ListTokenEvmChain"
import { InternalTokenBalance } from "@/serves/useInternalAssets"
import { LangContext } from "@/providers/LangProvider/LangProvider"
import { useContext } from "react"

interface ListTokenProps {
  ckbdata: Array<TokenBalance | InternalTokenBalance>
  btcdata: Array<TokenBalance | InternalTokenBalance>
  evmdata: Array<TokenBalance | InternalTokenBalance>
  addresses?: string[]
  ckbdataStatus: string
  btcDatastatus: string
  evmDataStatus: string
  isEvmAddress: boolean
  isBtcAddress: boolean
}

export default function ListToken({
  ckbdata,
  btcdata,
  evmdata,
  addresses,
  ckbdataStatus,
  btcDatastatus,
  evmDataStatus,
  isEvmAddress,
  isBtcAddress,
}: ListTokenProps) {
  const [activeTab, setActiveTab] = useState<"ckb" | "btc" | "evm">("ckb")
  const { lang } = useContext(LangContext)

  return (
    <div className="w-full shadow rounded-lg bg-white py-4">
      {/* Tab 切换 */}
     <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
        <div className="text-xl font-semibold">{lang["Tokens"]}</div>
        <div>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === "ckb"
              ? "border-b-2 font-semibold border-[#333]"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("ckb")}
        >
          CKB
        </button>
        {isBtcAddress && 
            <button
            className={`py-2 px-4 text-sm font-medium ${
                activeTab === "btc"
                ? "border-b-2 font-semibold border-[#333]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("btc")}
            >
            BTC
            </button>
        }
       {
        isEvmAddress && 
            <button
            className={`py-2 px-4 text-sm font-medium ${
                activeTab === "evm"
                    ? "border-b-2 font-semibold border-[#333]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
            onClick={() => setActiveTab("evm")}
             >
            EVM
        </button>
       }
        </div>
      </div>

      {/* 内容区域 */}
      <div className="mt-4">
        {activeTab === "ckb" && (
          <ListTokenCkbChain
            data={ckbdata}
            status={ckbdataStatus}
            addresses={addresses}
          />
        )}
        {activeTab === "btc" && (
          <ListTokenBtcChain
            data={btcdata}
            status={btcDatastatus}
            addresses={addresses}
          />
        )}
        {activeTab === "evm" && (
          <ListTokenEvmChain
            data={evmdata}
            status={evmDataStatus}
            addresses={addresses}
          />
        )}
      </div>
    </div>
  )
}
