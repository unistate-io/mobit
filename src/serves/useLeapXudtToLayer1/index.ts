import {BtcHelper, CkbHelper, convertToTransaction, leapFromCkbToBtcTransaction} from "mobit-sdk"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {useContext, useMemo} from "react"
import {BtcApiUtxo} from "@rgbpp-sdk/service"
import {ccc} from "@ckb-ccc/connector-react"
import useBtcWallet from "@/serves/useBtcWallet"

export type BtcUtxo = BtcApiUtxo

export default function useLeapXudtToLayer1() {
    const {network, address, signer} = useContext(CKBContext)
    const {isBtcWallet, getSignPsbtWallet} = useBtcWallet()

    const btcHelper = useMemo(() => {
        if (!isBtcWallet) return null
        const wallet = getSignPsbtWallet()!
        return new BtcHelper(wallet, network === "mainnet" ? 0 : 1, network !== "mainnet" ? "Testnet3" : undefined)
    }, [network, isBtcWallet])

    const getUTXO = async (props: {btcAddress: string}) => {
        if (!btcHelper) {
            console.warn("not supported wallet")
            return []
        }

        const utxos = await btcHelper.btcService.getBtcUtxos(props.btcAddress, {
            only_non_rgbpp_utxos: true,
            only_confirmed: true,
            min_satoshi: 546
        })

        return utxos as BtcUtxo[]
    }

    const buildLeapTx = async (props: {
        outIndex: number
        btcTxId: string
        transferAmount: bigint
        xudtType: CKBComponents.Script
        feeRate?: bigint
    }) => {
        if (!signer) {
            throw new Error("Please connect wallet")
        }

        if (!isBtcWallet) {
            throw new Error("Unsupported wallet")
        }
        const ckbHelper = new CkbHelper(network === "mainnet")

        const tx = await leapFromCkbToBtcTransaction({
            outIndex: props.outIndex,
            btcTxId: props.btcTxId,
            xudtType: props.xudtType,
            transferAmount: props.transferAmount,
            btcTestnetType: network !== "mainnet" ? "Testnet3" : undefined,
            collector: ckbHelper.collector,
            ckbAddress: address!
        })

        const skeleton = convertToTransaction(tx)
        console.log(
            "Transaction skeleton before fee completion:",
            JSON.stringify(skeleton, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2)
        )

        await skeleton.completeFeeBy(signer, props.feeRate)
        console.log(
            "Final transaction skeleton:",
            JSON.stringify(skeleton, (key, value) => (typeof value === "bigint" ? value.toString() : value), 2)
        )
        return skeleton
    }

    const leap = async (tx: ccc.Transaction) => {
        if (!signer) {
            throw new Error("Please connect wallet")
        }

        return await signer.sendTransaction(tx)
    }

    return {buildLeapTx, getUTXO, leap}
}
