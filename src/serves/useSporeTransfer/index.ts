import {transferSpore} from "@ckb-ccc/spore"
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {config as lumosConfig, helpers} from "@ckb-lumos/lumos"
import {ccc} from "@ckb-ccc/connector-react"
import {Spores} from "@/utils/graphql/types"

export default function useSporeTransfer() {
    const {signer, network} = useContext(CKBContext)

    const build = async ({to, spore, feeRate}: {to: string; spore: Spores; feeRate: ccc.NumLike}) => {
        if (!signer) {
            throw new Error("please set signer")
        }

        const scriptConfig = network === "testnet" ? lumosConfig.TESTNET : lumosConfig.MAINNET
        const toLock = helpers.addressToScript(to, {config: scriptConfig})

        const {tx} = await transferSpore({
            to: toLock,
            id: spore.spore_id.replace("\\", "0"),
            signer
        })

        await tx.completeFeeBy(signer, feeRate)

        return tx
    }

    const send = async (tx: ccc.Transaction) => {
        if (!signer) {
            throw new Error("please set signer")
        }

        return await signer.sendTransaction(tx)
    }

    return {
        build,
        send
    }
}
