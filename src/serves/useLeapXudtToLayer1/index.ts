import {BtcHelper, CkbHelper, convertToTxSkeleton, leapFromCkbToBtc} from "mobit-sdk"
import {CKBContext,} from "@/providers/CKBProvider/CKBProvider"
import {useContext, useMemo} from "react"
import {BtcApiUtxo} from '@rgbpp-sdk/service'
import {ccc} from "@ckb-ccc/connector-react";
import {helpers} from "@ckb-lumos/lumos";

export type BtcUtxo =  BtcApiUtxo

export default function useLeapXudtToLayer1() {
    const {network, wallet, address, signer} = useContext(CKBContext)

    const supportedWallet = useMemo(() => {
        return !!wallet
            && wallet.name === 'UniSat'
            && !!wallet.signers[0]
            && !!wallet.signers[0].name?.includes('BTC')
    }, [wallet])

    const btcHelper = useMemo(() => {
        let unisat = (window as any).unisat
        if (!supportedWallet || !unisat) return null
        return new BtcHelper(unisat, network === 'mainnet' ? 0 : 1, network !== 'mainnet' ? 'Testnet3' : undefined)
    }, [network, supportedWallet])

    const getUTXO = async (props: { btcAddress: string }) => {
        if (!btcHelper) {
            console.warn('unisat not found')
            return []
        }

        const utxos = await btcHelper.btcService.getBtcUtxos(props.btcAddress, {
            only_non_rgbpp_utxos: true,
            only_confirmed: true,
            min_satoshi: 546
        })

        return utxos as BtcUtxo[]
    }

    const prepareUTXO = async (props: { btcAddress: string }) => {
        let unisat = (window as any).unisat

        if (!unisat) {
            throw new Error('unisat not found')
        }

        const txid = await unisat.sendBitcoin(props.btcAddress, 546, {feeRate : 10})
        console.log(txid)
        return txid as string
    }

    const buildLeapTx = async (props: {
        outIndex: number,
        btcTxId: string,
        transferAmount: bigint,
        xudtTypeArgs: string
        feeRate?: bigint,
    }) => {
        if (!signer) {
            throw new Error('Please connect wallet')
        }

        if (!supportedWallet) {
            throw new Error('Unsupported wallet')
        }

        const ckbHelper = new CkbHelper(network === 'mainnet')

        const tx = await leapFromCkbToBtc({
            outIndex: props.outIndex,
            btcTxId: props.btcTxId,
            xudtTypeArgs: props.xudtTypeArgs,
            transferAmount: props.transferAmount,
            isMainnet: network === 'mainnet',
            btcTestnetType: network !== 'mainnet' ?  'Testnet3' : undefined,
            collector: ckbHelper.collector,
            ckbAddress: address!,
            cccSigner: signer as any,
        }, props.feeRate)

        const skeleton = await convertToTxSkeleton(tx, ckbHelper.collector)

        console.log('tx', skeleton)
        return skeleton
    }

    const leap = async (tx:helpers.TransactionSkeletonType) => {
        if (!signer) {
            throw new Error('Please connect wallet')
        }

        return await signer.sendTransaction(ccc.Transaction.fromLumosSkeleton(tx))
    }

    return {supportedWallet, buildLeapTx, getUTXO, leap, prepareUTXO}
}
