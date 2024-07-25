import {transferSpore} from '@spore-sdk/core'
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {commons, config as lumosConfig, helpers} from "@ckb-lumos/lumos"
import { predefinedSporeConfigs, getSporeById } from '@spore-sdk/core'
import {ccc} from "@ckb-ccc/connector-react"

export default function useSporeTransfer() {
    const {signer, network} = useContext(CKBContext)

    const build = async ({payeeAddresses, to, sporeId, feeRate}: {payeeAddresses: string[], to: string, sporeId: string, feeRate: number}) => {
        const sporeConfig = network === 'testnet' ? (predefinedSporeConfigs as any).Aggron4 : (predefinedSporeConfigs as any).Lina
        const sporeCell = await getSporeById(sporeId.replace('\\', '0'), sporeConfig)
        const scriptConfig = network === 'testnet' ? lumosConfig.TESTNET : lumosConfig.MAINNET
        const toLock = await helpers.addressToScript(to, {config: scriptConfig})


        const { txSkeleton } = await transferSpore({
            outPoint: sporeCell.outPoint!,
            fromInfos: payeeAddresses,
            toLock,
            config: sporeConfig,
        })

        return await commons.common.payFeeByFeeRate(
            txSkeleton,
            payeeAddresses,
            feeRate,
            undefined,
            {config: scriptConfig}
        )
    }

    const send = async ({txSkeleton}: {txSkeleton: helpers.TransactionSkeletonType, feeRate: number, payeeAddresses: string[]}) => {
        if (!signer) {
            throw new Error('please set signer')
        }

        const cccLib = ccc as any
        const tx = cccLib.Transaction.fromLumosSkeleton(txSkeleton)

        console.log('cccLib.Transaction', cccLib.Transaction)
        const hash = await signer.sendTransaction(tx)
        return hash
    }

    return {
        build,
        send
    }

}
