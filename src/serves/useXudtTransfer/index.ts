import {Indexer} from '@ckb-lumos/lumos'
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"
import {transferTokenToAddress} from './lib'
import {TokenInfo} from "@/utils/graphql/types"

export default function useXudtTransfer() {
    const {signer, config} = useContext(CKBContext)

    const build = async ({
                             from,
                             to,
                             amount,
                             feeRate,
                             tokenInfo
                         }: { from: string, to: string, amount: string, payeeAddress: string, tokenInfo: TokenInfo, feeRate: number }) => {

        const indexer = new Indexer(config.ckb_indexer, config.ckb_rpc)

        const txInfo = await transferTokenToAddress(
            from,
            amount,
            to,
            tokenInfo,
            indexer
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

        const indexer = new Indexer(config.ckb_indexer, config.ckb_rpc)
        const tx = await transferTokenToAddress(
            from,
            amount,
            to,
            tokenInfo,
            indexer
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
