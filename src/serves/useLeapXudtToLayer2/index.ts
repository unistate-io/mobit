import {useContext, useMemo} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {BtcHelper, CkbHelper, prepareLeapUnsignedPsbt, leapFromBtcToCkbCombined} from "mobit-sdk"
import { DataSource, NetworkType } from 'rgbpp/btc'
import useBtcWallet from '@/serves/useBtcWallet'

export default function useLeapXudtToLayer2() {
    const {network, internalAddress} = useContext(CKBContext)
    const {isBtcWallet, getSignPsbtWallet} = useBtcWallet()

    const btcHelper = useMemo(() => {
        if (!isBtcWallet) return null
        const wallet = getSignPsbtWallet()!
        return new BtcHelper(wallet, network === 'mainnet' ? 0 : 1, network !== 'mainnet' ? 'Testnet3' : undefined)
    }, [network, isBtcWallet])

    const build = async (props: {
        fromBtcAccount: string,
        toCkbAddress: string
        xudtArgs: string,
        amount: string
    }) => {
        if (!btcHelper) {
            throw new Error('Not supported wallet')
        }

        const ckbHelper = new CkbHelper(network === 'mainnet')
        const pubKey = await (window as any).unisat.getPublicKey()
        const btcDataSource = new DataSource(btcHelper?.btcService, network === 'mainnet' ? NetworkType.MAINNET : NetworkType.TESTNET)

        return await prepareLeapUnsignedPsbt({
                btcService: btcHelper.btcService,
                toCkbAddress: props.toCkbAddress,
                xudtTypeArgs: props.xudtArgs,
                transferAmount: BigInt(props.amount),
                isMainnet: network === 'mainnet',
                btcTestnetType: network !== 'mainnet' ?  'Testnet3' : undefined,
                collector: ckbHelper.collector,
                fromBtcAccount: internalAddress!,
                fromBtcAccountPubkey: pubKey,
                btcDataSource,
                btcFeeRate: 10
        })
    }

    const leap = async (props: {
        fromBtcAccount: string,
        toCkbAddress: string
        xudtArgs: string,
        amount: string
    }) => {
        if (!btcHelper) {
            throw new Error('Not supported wallet')
        }

        const pubKey = await (window as any).unisat.getPublicKey()
        return await leapFromBtcToCkbCombined({
            toCkbAddress: props.toCkbAddress,
            xudtTypeArgs: props.xudtArgs,
            transferAmount: BigInt(props.amount),
            collector: new CkbHelper(network === 'mainnet').collector,
            btcDataSource: new DataSource(btcHelper?.btcService, network === 'mainnet' ? NetworkType.MAINNET : NetworkType.TESTNET),
            btcTestnetType: network !== 'mainnet' ?  'Testnet3' : undefined,
            isMainnet: network === 'mainnet',
            fromBtcAccount: internalAddress!,
            fromBtcAccountPubkey: pubKey,
            wallet: getSignPsbtWallet()!,
            btcService: btcHelper.btcService
        }, 10)
    }

    return {
        build,
        leap
    }
}
