import { ccc  } from "@ckb-ccc/connector-react";
import {createContext, useEffect, useState} from "react";
import {Signer} from "@ckb-ccc/core/dist/signer/signer";
import {ConnectorStatus} from "@ckb-ccc/connector";

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
    open: () => {},
    disconnect: () => {},
    status: ConnectorStatus.SelectingSigner
})

export default function CKBProvider({children}: {children: any}) {
    const {open, disconnect, wallet, status} = ccc.useCcc()
    const signer = ccc.useSigner();

    const [internalAddress, setInternalAddress] = useState<undefined | string>(undefined)
    const [address, setAddress] = useState<undefined | string>(undefined)

    useEffect(() => {
        if (!signer) {
            setInternalAddress(undefined)
            setAddress(undefined)
            return;
        }

        (async () => {
            const internalAddress = await signer.getInternalAddress()
            const address = await signer.getRecommendedAddress()
            setInternalAddress(internalAddress)
            setAddress(address)
        })();
    }, [signer]);


    return (
        <CKBContext.Provider value={{open, disconnect, wallet, signer, status, internalAddress, address}}>
            {children}
        </CKBContext.Provider>
    )
}
