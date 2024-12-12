import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"
import {TokenInfoWithAddress} from "@/utils/graphql/types"
import {CkbHelper, convertToTransaction, createTransferXudtTransaction} from "mobit-sdk"
import JSONbig from "json-bigint"

export default function useXudtTransfer() {
    const {signer, network, wallet} = useContext(CKBContext)
    const build = async ({
        froms,
        to,
        amount,
        feeRate,
        tokenInfo
    }: {
        froms: string[]
        to: string
        amount: string
        tokenInfo: TokenInfoWithAddress
        feeRate: number
    }): Promise<ccc.Transaction | null> => {
        if (!signer) return null

        const ckbHelper = new CkbHelper(network === "mainnet")
        const tx = await createTransferXudtTransaction(
            {
                xudtArgs: tokenInfo.address.script_args.replace("\\", "0"),
                receivers: [{toAddress: to, transferAmount: BigInt(amount)}],
                ckbAddresses: froms,
                collector: ckbHelper.collector,
                isMainnet: network === "mainnet"
            },
            froms[0]
        )

        console.log(tx)
        const skeleton = convertToTransaction(tx, signer, feeRate)
        console.log(skeleton)
        return skeleton
    }

    const signAndSend = async ({
        froms,
        to,
        amount,
        feeRate,
        tokenInfo
    }: {
        froms: string[]
        to: string
        amount: string
        tokenInfo: TokenInfoWithAddress
        feeRate: number
    }) => {
        if (!signer) {
            throw new Error("Please connect wallet first")
        }

        const tx = await build({
            froms,
            to,
            amount,
            feeRate,
            tokenInfo
        })

        const signedTx = await signer.signTransaction(tx!)

        return await signer.client.sendTransaction(signedTx)
    }

    return {
        build,
        signAndSend
    }
}
