import {createContext, useEffect, useMemo, useState} from "react";
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
// @ts-ignore
import {
    WalletProvider,
    RoochProvider as RoochProviderNative,
    useConnectWallet,
    useWallets,
    Wallet,
    useCurrentAddress,
    useConnectionStatus,
    useCurrentWallet
} from '@roochnetwork/rooch-sdk-kit'

import * as roochSDk from '@roochnetwork/rooch-sdk-kit'
import {networkConfig} from './network_config';
import {useNavigate} from "react-router-dom";
import {defaultTheme, getTheme, UserTheme} from "@/providers/UserProvider/themes";


export const DefaultNetwork = 'testnet'

export type RoochContextType = {
    connect: (wallet: Wallet) => any
    disconnect: () => any
    wallets: readonly Wallet[]
    theme: UserTheme
    btcAddress?: string
    roochAddress?: string
    network: string
}

export const RoochContext = createContext<RoochContextType>({
    connect: () => {
    },
    disconnect: () => {
    },
    wallets: [],
    theme: defaultTheme,
    network: DefaultNetwork
})

const queryClient = new QueryClient()

function RoochProviderInner({children}: { children: any }) {
    const { mutateAsync: connectWallet,  } = useConnectWallet();
    const wallets = useWallets();
    const currentAddress = useCurrentAddress();
    const connectionStatus = useConnectionStatus();
    const currentWallet = useCurrentWallet();
    const navigate = useNavigate()

    const disconnectWallet = () => {};
    console.log('roochSDk', roochSDk)

    useEffect(() => {
        console.log('currentAddress', currentAddress)
        console.log('connectionStatus', connectionStatus)
        console.log('rooch address', currentAddress?.genRoochAddress().toStr())
        console.log('currentWallet', currentWallet)
    }, [currentAddress, connectionStatus, currentWallet]);

    const connect = async (wallet: Wallet) => {
        try {
            await connectWallet({ wallet });
        } catch (e:any) {
            console.error(e)
        }
    }

    const btcAddress = useMemo(() => {
        if (!currentAddress) {
            return undefined
        }
        return currentAddress.toStr()
    }, [currentAddress])

    const roochAddress = useMemo(() => {
        if (!currentAddress) {
            return undefined
        }
        return currentAddress.genRoochAddress().toStr()
    }, [currentAddress])

    const theme = useMemo(() => {
        if (roochAddress) {
            return getTheme(roochAddress)
        } else {
            return defaultTheme
        }
    }, [roochAddress])

    useEffect(() => {
        if (roochAddress) {
            navigate(`/rooch/address/${roochAddress}`)
        }
    }, [roochAddress]);

    return <RoochContext.Provider value={{connect, disconnect: disconnectWallet, wallets, btcAddress, roochAddress, theme, network: DefaultNetwork}}>
       {children}
   </RoochContext.Provider>
}

export default function RoochProvider({children}: { children: any }) {
    return <QueryClientProvider client={queryClient}>
        <RoochProviderNative defaultNetwork={DefaultNetwork} networks={networkConfig}>
            <WalletProvider chain="bitcoin" autoConnect>
                <RoochProviderInner>
                    {children}
                </RoochProviderInner>
            </WalletProvider>
        </RoochProviderNative>
    </QueryClientProvider>
}
