import {useContext, useMemo} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {AbstractWallet, JoyIDWallet, OKXWallet, UniSatWallet} from 'mobit-wallet'
import {isBtcAddress} from "@/utils/common";


export default function useBtcWallet() {
    const {wallet, network, internalAddress} = useContext(CKBContext)

    const isBtcWallet = useMemo<boolean>(() => {
        const supportedWallets = ['UniSat', 'JoyID', 'OKX Wallet']
        return !!internalAddress
            && isBtcAddress(internalAddress, network === 'mainnet')
            && !!wallet
            && supportedWallets.includes(wallet.name)
            && !!wallet.signers.length
            && wallet.signers.some((s: { name: string, signer: any }) => s.name === 'BTC')
    }, [internalAddress, network, wallet])

    const allowCreateUTXO = useMemo<boolean>(() => {
        const supportedWallets = ['UniSat', 'OKX Wallet']
        return !!internalAddress
            && isBtcAddress(internalAddress, network === 'mainnet')
            && !!wallet
            && supportedWallets.includes(wallet.name)
            && !!wallet.signers.length
            && wallet.signers.some((s: { name: string, signer: any }) => s.name === 'BTC')
    }, [internalAddress, network, wallet])

    const getSignPsbtWallet = (): AbstractWallet | undefined => {
        if (!isBtcWallet) {
            console.warn('Not supported wallet')
            return undefined
        }

        if (wallet.name === 'UniSat') {
            return new UniSatWallet()
        } else if (wallet.name === 'JoyID') {
            return new JoyIDWallet()
        } else if (wallet.name === 'OKX Wallet') {
            return new OKXWallet()
        } else {
            return undefined
        }
    }

    const createUTXO = async (props: { btcAddress: string }) => {
        if (!allowCreateUTXO) {
            throw new Error('Not supported wallet')
        }

        if (wallet.name === 'UniSat') {
            let unisat = (window as any).unisat
            const txid = await unisat.sendBitcoin(props.btcAddress, 546, {feeRate: 10})
            return txid as string
        } else if (wallet.name === 'OKX Wallet') {
            const okx = network === 'testnet' ? (window as any).okxwallet.bitcoinTestnet : (window as any).okxwallet.bitcoin
            let txid = await okx.sendBitcoin(props.btcAddress, 546, {feeRate: 10})
            return txid as string
        } else {
            throw new Error('Not supported wallet')
        }
    }


    return {
        isBtcWallet,
        allowCreateUTXO,
        getSignPsbtWallet,
        createUTXO
    }
}
