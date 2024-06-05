import {commons, helpers, Indexer} from '@ckb-lumos/lumos'
import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"


const CKB_RPC_URL = process.env.REACT_APP_CKB_RPC_URL!
const CKB_INDEXER_URL = process.env.REACT_APP_CKB_INDEXER_URL!

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export default function useCkbTransfer(address: string) {
    const {signer} = useContext(CKBContext)

    const build = async ({
                             from,
                             to,
                             amount,
                             payeeAddress,
                             feeRate
                         }: { from: string, to: string, amount: string, payeeAddress: string, feeRate: number }) => {
        const _txSkeleton = helpers.TransactionSkeleton({cellProvider: indexer})
        const txSkeleton = await commons.common.transfer(
            _txSkeleton,
            [from],
            to,
            BigInt(amount),
        )

        return await commons.common.payFeeByFeeRate(
            txSkeleton,
            [payeeAddress],
            feeRate,
        )
    }

    const calculateFee = async (feeRate: number, tx: helpers.TransactionSkeletonType, payeeAddress: string) => {
        const newTxSkeleton = await commons.common.payFeeByFeeRate(
            tx,
            [payeeAddress],
            feeRate)

        const txSize = await commons.common.__tests__.getTransactionSize(newTxSkeleton!)
        const fee = (txSize + 4) * feeRate / 1000

        return fee + ''
    }

    const calculateSize = async (tx: helpers.TransactionSkeletonType) => {
        const size = await commons.common.__tests__.getTransactionSize(tx!)
        return size.toString()
    }

    const signAndSend = async ({
                                   to,
                                   amount,
                                   feeRate,
                                   sendAll
                               }: { to: string, amount: string, feeRate: number, sendAll?: boolean }) => {
        if (!signer) {
            throw new Error('Please connect wallet first')
        }


        if (sendAll) {
            console.log('signAndSend send all')
        }

        const _txSkeleton = helpers.TransactionSkeleton({cellProvider: indexer})
        let txSkeleton = await commons.common.transfer(
            _txSkeleton,
            [await signer.getRecommendedAddress()],
            to,
            BigInt(amount)
        )

        txSkeleton = await commons.common.payFeeByFeeRate(
            txSkeleton,
            [sendAll ? to : await signer.getRecommendedAddress()],
            feeRate,
        )

        console.log('txSkeleton', txSkeleton)

        const cccLib = ccc as any
        const tx = cccLib.Transaction.fromLumosSkeleton(txSkeleton)
        console.log('fromLumosSkeleton', tx)

        const hash = await signer.sendTransaction(tx)
        return hash
    }


    return {
        build,
        calculateFee,
        calculateSize,
        signAndSend
    }
}
