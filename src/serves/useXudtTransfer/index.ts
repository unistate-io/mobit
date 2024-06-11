import {helpers, Indexer} from '@ckb-lumos/lumos'
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"
import {transferXudt} from './2-transfer-xudt'
import {transferTokenToAddress} from './lib'


const CKB_RPC_URL = process.env.REACT_APP_CKB_RPC_URL!
const CKB_INDEXER_URL = process.env.REACT_APP_CKB_INDEXER_URL!

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export default function useXudtTransfer() {
    const {signer} = useContext(CKBContext)

    const build = async ({
                             from,
                             to,
                             amount,
                             feeRate
                         }: { from: string, to: string, amount: string, payeeAddress: string, feeRate: number }) => {

        const _txSkeleton = helpers.TransactionSkeleton({cellProvider: indexer})

        console.log('_txSkeleton', _txSkeleton)

        const txInfo = await transferXudt({
            fromAddress: from,
            xudtType: {
                codeHash: '0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95',
                hashType: 'data1',
                args: '0x6b33c69bdb25fac3d73e3c9e55f88785de27a54d722b4ab3455212f9a1b1645c'
            },
            receivers: [{
                toAddress: to,
                transferAmount: BigInt(amount)
            }]
        })

        console.log('txInfo', txInfo)

        return txInfo
    }


    const signAndSend = async ({
                                   from,
                                   to,
                                   amount,
                                   feeRate,
                                   sendAll
                               }: { from: string, to: string, amount: string, feeRate: number, sendAll?: boolean }) => {
        if (!signer) {
            throw new Error('Please connect wallet first')
        }

       const tx = await transferTokenToAddress(
           from,
           amount,
           to
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
