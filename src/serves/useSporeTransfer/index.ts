import {transferSpore} from "@ckb-ccc/spore"
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {config as lumosConfig, helpers} from "@ckb-lumos/lumos"
import {ccc} from "@ckb-ccc/connector-react"
import {Spores} from "@/utils/graphql/types"
import {Script} from "@ckb-lumos/base"

const hashType: any = {
    "0": "data",
    "1": "type",
    "2": "data1",
    "3": "data2"
}

export default function useSporeTransfer() {
    const {signer, network} = useContext(CKBContext)

    const build = async ({
        payeeAddresses,
        to,
        spore,
        feeRate
    }: {
        payeeAddresses: string[]
        to: string
        spore: Spores
        feeRate: number
    }) => {
        if (!signer) {
            throw new Error("please set signer")
        }

        const type: Script = {
            codeHash: spore.addressByTypeId.script_code_hash.replace("\\", "0"),
            hashType: hashType[spore.addressByTypeId.script_hash_type],
            args: spore.addressByTypeId.script_args.replace("\\", "0")
        }

        const scriptConfig = network === "testnet" ? lumosConfig.TESTNET : lumosConfig.MAINNET
        const toLock = helpers.addressToScript(to, {config: scriptConfig})

        const {tx} = await transferSpore({
            to: toLock,
            id: type.codeHash,
            signer
        })

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
