import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"
import {TokenInfoWithAddress} from "@/utils/graphql/types"
import {CkbHelper, createTransferXudtTransaction} from 'mobit-sdk'

export default function useXudtTransfer() {
    const {signer, network} = useContext(CKBContext)

    const build = async ({
                             froms,
                             to,
                             amount,
                             feeRate,
                             tokenInfo
                         }: { froms: string[], to: string, amount: string, tokenInfo: TokenInfoWithAddress, feeRate: number }): Promise<ccc.Transaction> => {

        // const indexer = new Indexer(config.ckb_indexer, config.ckb_rpc)

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
        const _tx = await createTransferXudtTransaction({
            xudtArgs: tokenInfo.address.script_args,
            receivers: [{toAddress: to, transferAmount: BigInt(amount)}],
            ckbAddresses: froms,
            collector: ckbHelper.collector,
            isMainnet: network === 'mainnet'
        }, undefined, BigInt(feeRate))

        return ccc.Transaction.from(JSON.parse(JSON.stringify(_tx)))
    }


    const signAndSend = async ({
                                   froms,
                                   to,
                                   amount,
                                   feeRate,
                                   tokenInfo
                               }: { froms: string[], to: string, amount: string, tokenInfo: TokenInfoWithAddress, feeRate: number }) => {
        if (!signer) {
            throw new Error('Please connect wallet first')
        }

        const tx = await build({
            froms,
            to,
            amount,
            feeRate,
            tokenInfo
        })
        return await signer.sendTransaction(tx)
    }


    return {
        build,
        signAndSend
    }
}
