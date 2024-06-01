import {ccc} from "@ckb-ccc/connector-react";
import {createContext, useEffect, useState} from "react";
import {Signer} from "@ckb-ccc/core/dist/signer/signer";
import {ConnectorStatus} from "@ckb-ccc/connector";

const cccLib: any = ccc

export interface CKBContextType {
    open: () => any;
    disconnect: () => any
    status: ConnectorStatus
    wallet?: string
    internalAddress?: string
    address?: string
    signer?: Signer
}

export const CKBContext = createContext<CKBContextType>({
    open: () => {
    },
    disconnect: () => {
    },
    status: ConnectorStatus.SelectingSigner
})



export default function CKBProvider({children}: { children: any }) {
    const {open, disconnect, wallet, status, setClient} = cccLib.useCcc()
    const signer = ccc.useSigner();

    const [internalAddress, setInternalAddress] = useState<undefined | string>(undefined)
    const [address, setAddress] = useState<undefined | string>(undefined)

    useEffect(() => {
        setClient(new cccLib.ClientPublicMainnet())
    }, [])

    useEffect(() => {
        if (!signer) {
            setInternalAddress(undefined)
            setAddress(undefined)
            return;
        }

        (async () => {
            console.log('signer', signer)
            const internalAddress = await signer.getInternalAddress()
            const address = await signer.getRecommendedAddress()
            setInternalAddress(internalAddress)
            setAddress(address)
        })();
    }, [signer]);


    return (
        <CKBContext.Provider value={{open: () => {
                setClient(new cccLib.ClientPublicMainnet())
                open()
            }, disconnect, wallet, signer, status, internalAddress, address}}>
            {children}
        </CKBContext.Provider>
    )
}
