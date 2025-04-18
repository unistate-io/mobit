import { useUtxoSwap } from "../useUtxoSwap"
import {addressToScript} from "@nervosnetwork/ckb-sdk-utils"
import {useContext, useState} from "react"
import { CKBContext } from "@/providers/CKBProvider/CKBProvider"

export default function useNervdao() {
    const {collector} = useUtxoSwap()
    const {network} = useContext(CKBContext)
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [depositedCkb, setDepositedCkb] = useState<bigint>(BigInt(0))
    const [redeemingCkb, setRedeemingCkb] = useState<bigint>(BigInt(0))

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

        let DepositedCkb = BigInt(0)
        let RedeemingCkb = BigInt(0)

        if (!cells || cells.length === 0) {
            setDepositedCkb(BigInt(0))
            setRedeemingCkb(BigInt(0))
            setStatus("success")
            return
        }

        for (const cell of cells) {
            if (cell.outputData === '0x0000000000000000') {
                DepositedCkb += BigInt(cell.output.capacity)
            } else {
                RedeemingCkb += BigInt(cell.output.capacity)
            }
        }

        setDepositedCkb(DepositedCkb)
        setRedeemingCkb(RedeemingCkb)
        setStatus("success")
    }

  
    return {
        getDepositedCkb,
        depositedCkb,
        status,
        redeemingCkb
    }
}