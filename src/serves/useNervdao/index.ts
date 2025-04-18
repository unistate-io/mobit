import { useUtxoSwap } from "../useUtxoSwap"
import {addressToScript} from "@nervosnetwork/ckb-sdk-utils"
import {useContext, useState} from "react"
import { CKBContext } from "@/providers/CKBProvider/CKBProvider"

export default function useNervdao() {
    const {collector} = useUtxoSwap()
    const {network} = useContext(CKBContext)
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [depositedCkb, setDepositedCkb] = useState<bigint>(BigInt(0))

    const getDepositedCkb = async (walletAddress: string) => {
        if (network !== "mainnet") {
            setDepositedCkb(BigInt(0))
            setStatus("success")
            return
        }
        
        setStatus("loading")
        const cells = await collector.getCells({
            lock: addressToScript(walletAddress),
            type: {
                args: '0x',
                codeHash: '0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e',
                hashType: 'type'
            }
        })

        const total = cells?.reduce((acc, cell) => acc + BigInt(cell.output.capacity), BigInt(0))
        setDepositedCkb(total || BigInt(0))
        setStatus("success")
    }

    return {
        getDepositedCkb,
        depositedCkb,
        status
    }
}