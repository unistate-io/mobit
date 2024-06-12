import {ccc} from "@ckb-ccc/connector-react";
import {createContext, useEffect, useState} from "react";
import {Signer} from "@ckb-ccc/core/dist/signer/signer";

const cccLib: any = ccc

export interface CKBContextType {
    open: () => any;
    disconnect: () => any
    wallet?: string
    internalAddress?: string
    address?: string
    signer?: Signer | undefined
}

export const CKBContext = createContext<CKBContextType>({
    open: () => {
    },
    disconnect: () => {
    }
})

export default function CKBProvider({children}: { children: any }) {
    const {open, disconnect, wallet, setClient} = cccLib.useCcc()
    const signer = ccc.useSigner();

    const [internalAddress, setInternalAddress] = useState<undefined | string>(undefined)
    const [address, setAddress] = useState<undefined | string>(undefined)

    useEffect(() => {
        if (!signer) {
            setInternalAddress(undefined)
            setAddress(undefined)
            return
        }

        if (!(signer as any)?.client_.url.includes('mainnet')) {
            setClient(new cccLib.ClientPublicMainnet())
            return
        }

        (async () => {
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
            }, disconnect, wallet, signer, internalAddress, address}}>
            {children}
        </CKBContext.Provider>
    )
}
