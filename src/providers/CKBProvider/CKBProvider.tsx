import {ccc} from "@ckb-ccc/connector-react";
import {createContext, useEffect, useState} from "react";
import {Signer} from "@ckb-ccc/core/dist/signer/signer";
import {NetworkConfig} from "@/providers/CKBProvider/network_config"
import network_config from "@/providers/CKBProvider/network_config";

const cccLib: any = ccc

export type Network = 'mainnet' | 'testnet'

export interface CKBContextType {
    open: () => any;
    network: Network
    disconnect: () => any
    wallet?: any
    internalAddress?: string
    address?: string
    signer?: Signer | undefined
    setNetwork: (network: Network) => any
    config: NetworkConfig
}

export const CKBContext = createContext<CKBContextType>({
    open: () => {
    },
    disconnect: () => {
    },
    setNetwork: (_network: Network) => {
    },
    config: network_config['mainnet'],
    network: 'mainnet'
})

export default function CKBProvider({children}: { children: any }) {
    const {open, disconnect, wallet, setClient} = cccLib.useCcc()
    const signer = ccc.useSigner();

    const [internalAddress, setInternalAddress] = useState<undefined | string>(undefined)
    const [address, setAddress] = useState<undefined | string>(undefined)
    const [network, _setNetwork] = useState<Network>(localStorage.getItem('ckb_network') as Network || 'mainnet')

    useEffect(() => {
        if (!signer) {
            setInternalAddress(undefined)
            setAddress(undefined)
            return
        }

        (async () => {
            const internalAddress = await signer.getInternalAddress()
            const address = await signer.getRecommendedAddress()
            setInternalAddress(internalAddress)
            setAddress(address)
        })();
    }, [signer])

    useEffect(() => {
        if (network && wallet && signer) {
            if (!(signer as any)?.client_.url.includes(network)) {
                if (network === 'testnet') {
                    setClient(new cccLib.ClientPublicTestnet())
                } else {
                    setClient(new cccLib.ClientPublicMainnet())
                }
                localStorage.setItem('ckb_network', network)
            }
        }
    }, [network, signer, wallet])

    return (
        <CKBContext.Provider value={{
            config: network_config[network],
            network,
            setNetwork: _setNetwork,
            open: () => {
                setClient(new cccLib.ClientPublicMainnet())
                open()
            }, disconnect, wallet, signer, internalAddress, address
        }}>
            {children}
        </CKBContext.Provider>
    )
}
