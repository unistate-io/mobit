import {helpers, Indexer} from '@ckb-lumos/lumos'
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"
import {transferTokenToAddress} from './lib'
import {TokenInfo} from "@/utils/graphql/types";


const CKB_RPC_URL = process.env.REACT_APP_CKB_RPC_URL!
const CKB_INDEXER_URL = process.env.REACT_APP_CKB_INDEXER_URL!

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export default function useXudtTransfer() {
    const {signer} = useContext(CKBContext)

    const build = async ({
                             from,
                             to,
                             amount,
                             feeRate,
                             tokenInfo
                         }: { from: string, to: string, amount: string, payeeAddress: string, tokenInfo: TokenInfo, feeRate: number }) => {

        const _txSkeleton = helpers.TransactionSkeleton({cellProvider: indexer})

        console.log('_txSkeleton', _txSkeleton)

        const txInfo = await transferTokenToAddress(
            from,
            amount,
            to,
            tokenInfo
        )

        console.log('txInfo', txInfo)

        return txInfo
    }


    const signAndSend = async ({
                                   from,
                                   to,
                                   amount,
                                   feeRate,
                                   sendAll,
                                   tokenInfo
                               }: { from: string, to: string, amount: string, tokenInfo: TokenInfo, feeRate: number, sendAll?: boolean }) => {
        if (!signer) {
            throw new Error('Please connect wallet first')
        }

       const tx = await transferTokenToAddress(
           from,
           amount,
           to,
           tokenInfo
       )


        const cccLib = ccc as any

        console.log('_________tx=>', tx)

        const _tx = cccLib.Transaction.fromLumosSkeleton(tx)
        console.log('cccLib.Transaction', cccLib.Transaction)
        const hash = await signer.sendTransaction(_tx)
        return hash
    }


    return {
        build,
        signAndSend
    }
}
