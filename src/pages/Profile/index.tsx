import UserProvider from "@/providers/UserProvider/UserProvider"
import {useParams} from "react-router-dom"
import Profile from "@/pages/Profile/Profile"
import EvmProfile from "./EvmProfile"
import {useContext, useEffect, useState} from "react"
import {
    checksumCkbAddress,
    getCkbAddressFromBTC,
    getCkbAddressFromEvm,
    isBtcAddress,
    isEvmAddress
} from "@/utils/common"
import {ccc} from "@ckb-ccc/connector-react"
import BtcProfile from "@/pages/Profile/BtcProfile"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {MarketProvider} from "@/providers/MarketProvider/MarketProvider"

export default function ProfilePage() {
    const {address} = useParams()
    const {client} = ccc.useCcc()
    const {network} = useContext(CKBContext)

    if (!address) {
        throw new Error('address is required')
    }

    const [displayAddress, setDisplayAddress] = useState('')
    const [displayInternalAddress, setDisplayInternalAddress] = useState('')
    const [ready, setReady] = useState(false)

    // check address type
    useEffect(() => {
        (async () => {
            // ckb address
            if (checksumCkbAddress(address, network)) {
                console.log('ckb profile')
                setDisplayAddress(address)
                setReady(true)
                return
            }

            // evm address
            if (!!client && isEvmAddress(address)) {
                console.log('evm profile')
                const res = await getCkbAddressFromEvm(address, client)
                setDisplayAddress(res!)
                setDisplayInternalAddress(address)
                setReady(true)
                return
            }

            // btc address
            if (!!client && isBtcAddress(address, network === 'mainnet')) {
                console.log('btc profile')
                const res = await getCkbAddressFromBTC(address, client, network === 'mainnet')
                if (!!res) {
                    setDisplayAddress(res!)
                    setDisplayInternalAddress(address)
                } else {
                    setDisplayInternalAddress(address)
                }
                setReady(true)
                return
            }

            setDisplayAddress(address)
            setReady(true)
        })()
    }, [address, client])

    return <>
        <MarketProvider>
            {ready && !!displayAddress &&
                <UserProvider address={displayAddress!}>
                    {
                        displayInternalAddress
                            ? <EvmProfile internalAddress={displayInternalAddress}/>
                            : <Profile/>
                    }
                </UserProvider>
            }

            {ready && !displayAddress && !!displayInternalAddress &&
                <BtcProfile internalAddress={displayInternalAddress}/>
            }
        </MarketProvider>
    </>
}
