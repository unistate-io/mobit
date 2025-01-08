import {createSpore} from "@ckb-ccc/spore"
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"
import {SporeDataView} from "@/utils/spore"

export default function useSporeCreate() {
    const {signer} = useContext(CKBContext)

    const build = async ({data, to, feeRate}: {data: SporeDataView; to?: ccc.ScriptLike; feeRate: ccc.NumLike}) => {
        if (!signer) {
            throw new Error("please set signer")
        }

        const {tx} = await createSpore({
            data,
            to,
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
