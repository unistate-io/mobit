import {BtcHelper, CkbHelper, transferCombined} from "mobit-sdk"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {useContext} from "react"


let unisat = (window as any).unisat

export default function useBtcXudtTransfer() {

    const {network} = useContext(CKBContext)

    const signAndSend = async ({from, to, args, amount}: {
        from: string;
        to: string;
        args: string;
        amount: string;
    }) => {
        if (!unisat) {
            throw new Error('unisat not found')
        }

        const btcHelper = new BtcHelper(unisat, network === 'mainnet' ? 0 : 1)
        const ckbHelper = new CkbHelper(network === 'mainnet')

        try {
            const {btcTxId, ckbTxHash} = await transferCombined({
                toBtcAddress: to,
                xudtTypeArgs: args,
                transferAmount: BigInt(amount),
                collector: ckbHelper.collector,
                isMainnet: ckbHelper.isMainnet,
                fromBtcAccount: from,
                btcService: btcHelper.btcService,
                btcDataSource: btcHelper.btcDataSource,
                unisat: btcHelper.unisat
            })

            return btcTxId
        } catch (e) {
            throw e
        }
    }


    return {signAndSend}
}
