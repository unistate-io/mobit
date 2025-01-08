import {meltSpore} from "@ckb-ccc/spore"
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"
import {Spores} from "@/utils/graphql/types"

export default function useSporeMelt() {
    const {signer} = useContext(CKBContext)

    const build = async ({spore, feeRate}: {spore: Spores; feeRate: ccc.NumLike}) => {
        if (!signer) {
            throw new Error("please set signer")
        }

        const {tx} = await meltSpore({
            id: spore.id.replace("\\", "0"),
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
