import {useContext} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {ccc} from "@ckb-ccc/connector-react"

export default function useCkbTransfer() {
    const {signer} = useContext(CKBContext)

    const build = async ({
                             to,
                             amount,
                             feeRate,
                             sendAll
                         }: {
        to: string,
        amount: string,
        feeRate: number,
        sendAll?: boolean
    }) => {

        if (!signer) {
            throw new Error('Please connect wallet first')
        }

        const {script: toLock} = await ccc.Address.fromString(
            to,
            signer.client,
        )

        const tx = ccc.Transaction.from({
            outputs: [{lock: toLock}],
            outputsData: [],
        })

        if (sendAll) {
            await tx.completeInputsAll(signer)
            await tx.completeFeeChangeToOutput(signer, 0, feeRate)
            return tx
        } else {
            tx.outputs.forEach((output, i) => {
                if (output.capacity > ccc.fixedPointFrom(amount, 0)) {
                    throw new Error(`Insufficient capacity at output ${i} to store data`)
                }
                output.capacity = ccc.fixedPointFrom(amount, 0)
            })

            await tx.completeInputsByCapacity(signer)
            await tx.completeFeeBy(signer, feeRate)
            return tx
        }
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

        const {script: toLock} = await ccc.Address.fromString(
            to,
            signer.client,
        )

        const tx = ccc.Transaction.from({
            outputs: [{lock: toLock}],
            outputsData: [],
        })

        if (sendAll) {
            await tx.completeInputsAll(signer)
            await tx.completeFeeChangeToOutput(signer, 0, feeRate)
            const hash = await signer.sendTransaction(tx);
            return hash
        } else {
            tx.outputs.forEach((output, i) => {
                if (output.capacity > ccc.fixedPointFrom(amount, 0)) {
                    throw new Error(`Insufficient capacity at output ${i} to store data`)
                }
                output.capacity = ccc.fixedPointFrom(amount, 0)
            })

            await tx.completeInputsByCapacity(signer);
            await tx.completeFeeBy(signer, feeRate);
            const hash = await signer.sendTransaction(tx);
            return hash
        }
    }

    return {
        build,
        signAndSend
    }
}
