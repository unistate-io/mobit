import {ccc as cccLib} from "@ckb-ccc/connector-react"
import {createContext, useEffect, useMemo, useRef, useState} from "react"
import {NetworkConfig} from "@/providers/CKBProvider/network_config"
import network_config from "@/providers/CKBProvider/network_config"
import {Client} from '@ckb-ccc/core'
import {redirect, useNavigate} from "react-router-dom"

export type Network = 'mainnet' | 'testnet'

export interface CKBContextType {
    open: () => any
    network: Network
    disconnect: () => any
    wallet?: any
    internalAddress?: string
    address?: string
    addresses?: string[]
    signer?: cccLib.Signer | undefined
    config: NetworkConfig,
    client?: Client
}

export const CKBContext = createContext<CKBContextType>({
    open: () => {
    },
    disconnect: () => {
    },
    config: network_config['mainnet'],
    network: 'mainnet'
})

export default function CKBProvider({children}: { children: any }) {
    const {open, disconnect, wallet, setClient, client} = cccLib.useCcc()
    const signer = cccLib.useSigner()
    const navigate = useNavigate()

    const [internalAddress, setInternalAddress] = useState<undefined | string>(undefined)
    const [address, setAddress] = useState<undefined | string>(undefined)
    const [addresses, setAddresses] = useState<undefined | string[]>(undefined)

    const needRedirect = useRef(false)

    const network = useMemo(() => {
        if (!client) {
            return 'mainnet'
        } else {
            return client instanceof cccLib.ClientPublicTestnet ? 'testnet' : 'mainnet'
        }
    }, [client])

    useEffect(() => {
        if (!signer) {
            setInternalAddress(undefined)
            setAddress(undefined)
            setAddresses(undefined)
            return
        }

        (async () => {
            const internalAddress = await signer.getInternalAddress()
            const address = await signer.getRecommendedAddress()
            const addresses = await signer.getAddresses()
            setInternalAddress(internalAddress)
            setAddress(address)
            setAddresses(addresses)

            if (needRedirect.current) {
                needRedirect.current = false
                navigate(`/address/${address}`)
            }
        })()
    }, [signer])

    useEffect(() => {
        localStorage.setItem('ckb_network', network)
        redirect('/')
    }, [network])

    return (
        <CKBContext.Provider value={{
            client,
            config: network_config[network],
            network,
            open: () => {
                needRedirect.current = true
                open()
            }, disconnect, wallet, signer, internalAddress, address, addresses
        }}>
            {children}
        </CKBContext.Provider>
    )
}
