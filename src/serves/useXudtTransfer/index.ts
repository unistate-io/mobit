import {Indexer} from '@ckb-lumos/lumos'
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"
import {TokenInfoWithAddress} from "@/utils/graphql/types"
import {CkbHelper, createTransferXudtTransaction} from 'mobit-sdk'

export default function useXudtTransfer() {
    const {signer, config, network} = useContext(CKBContext)

    const build = async ({
                             froms,
                             to,
                             amount,
                             feeRate,
                             tokenInfo
                         }: { froms: string[], to: string, amount: string, tokenInfo: TokenInfoWithAddress, feeRate: number }) => {

        const indexer = new Indexer(config.ckb_indexer, config.ckb_rpc)

        // const txInfo = await transferTokenToAddress(
        //     froms,
        //     amount,
        //     to,
        //     tokenInfo,
        //     indexer,
        //     feeRate,
        //     network
        // )

        // console.log('txInfo', txInfo)
        // return txInfo


        const ckbHelper = new CkbHelper(network === 'mainnet')
        const _tx = createTransferXudtTransaction({
            xudtArgs: tokenInfo.address.script_args,
            receivers: [{toAddress: to, transferAmount: BigInt(amount)}],
            ckbAddress: froms as any,
            collector:ckbHelper.collector,
            isMainnet: network === 'mainnet'
        }, BigInt(feeRate))

        const cccLib = ccc as any
        const __tx = cccLib.Transaction.fromLumosSkeleton(_tx)


        console.log(__tx)


        return __tx
    }


    const signAndSend = async ({
                                   froms,
                                   to,
                                   amount,
                                   feeRate,
                                   tokenInfo
                               }: { froms: string[], to: string, amount: string, tokenInfo: TokenInfoWithAddress, feeRate: number}) => {
        if (!signer) {
            throw new Error('Please connect wallet first')
        }

        const tx = await build(
            {
                froms,
                to,
                amount,
                feeRate,
                tokenInfo}
        )
        return await signer.sendTransaction(tx)
    }


    return {
        build,
        signAndSend
    }
}
