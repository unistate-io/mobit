import { useUtxoSwap } from "../useUtxoSwap"
import {addressToScript} from "@nervosnetwork/ckb-sdk-utils"
import {useRef, useState} from "react"

export default function useNervosdao() {
    const {collector} = useUtxoSwap()
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [depositedCkb, setDepositedCkb] = useState<bigint>(BigInt(0))
    const [redeemingCkb, setRedeemingCkb] = useState<bigint>(BigInt(0))
    const historyRef = useRef('')


    const getSingleAddressBalance = async (walletAddress: string) => {
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
            return {
                depositedCkb: BigInt(0),
                redeemingCkb: BigInt(0)
            }
        }

        for (const cell of cells) {
            if (cell.outputData === '0x0000000000000000') {
                DepositedCkb += BigInt(cell.output.capacity)
            } else {
                RedeemingCkb += BigInt(cell.output.capacity)
            }
        }

        return {
            depositedCkb: DepositedCkb,
            redeemingCkb: RedeemingCkb
        }
    }

    const getDepositedCkb = async (walletAddresses: string[]) => {
        if (historyRef.current === JSON.stringify(walletAddresses)) {
            return
        }

        historyRef.current = JSON.stringify(walletAddresses)

        setStatus("loading")

        const balances = await Promise.all(walletAddresses.map(getSingleAddressBalance))
        console.log("dao balances", balances)

        const depositedCkb = balances.reduce((acc, curr) => acc + curr.depositedCkb, BigInt(0))
        const redeemingCkb = balances.reduce((acc, curr) => acc + curr.redeemingCkb, BigInt(0))

        setDepositedCkb(depositedCkb)
        setRedeemingCkb(redeemingCkb)
        setStatus("success")

        historyRef.current = JSON.stringify(walletAddresses)
        console.log("getDepositedCkb", walletAddresses, depositedCkb, redeemingCkb)

        return {
            depositedCkb,
            redeemingCkb
        }
    }

  
    return {
        getDepositedCkb,
        depositedCkb,
        status,
        redeemingCkb
    }
}