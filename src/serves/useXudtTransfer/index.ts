import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"
import {tokenInfoToScript, TokenInfoWithAddress} from "@/utils/graphql/types"
import {CkbHelper, convertToTransaction, createTransferXudtTransaction} from "@/libs/mobit-sdk"

export default function useXudtTransfer() {
    const {signer, network} = useContext(CKBContext)
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
        const xudtType = tokenInfoToScript(tokenInfo)
        if (!xudtType) throw new Error("Invalid token info")

        const tx = await createTransferXudtTransaction(
            {
                xudtType,
                receivers: [{toAddress: to, transferAmount: BigInt(amount)}],
                ckbAddresses: froms,
                collector: ckbHelper.collector,
                isMainnet: network === "mainnet"
            },
            froms[0]
        )

        console.log(tx)

        const skeleton = convertToTransaction(tx) as unknown as ccc.Transaction
        await skeleton.completeFeeBy(signer, feeRate)

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
