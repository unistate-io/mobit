import UserProvider from "@/providers/UserProvider/UserProvider"
import {useParams} from "react-router-dom"
import Profile from "@/pages/Profile/Profile"
import InternalProfile from "./InternalProfile"
import {useEffect, useState} from "react"
import {checksumCkbAddress, getCkbAddressFromEvm} from "@/utils/common"
import {ccc} from "@ckb-ccc/connector-react"

export default function ProfilePage() {
    const {address} = useParams()
    const {client} = ccc.useCcc()

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
            if (checksumCkbAddress(address)) {
                setDisplayAddress(address)
                setReady(true)
                return
            }


            // evm address
            if (!!client && address.startsWith('0x') && address.length === 42) {
                const res = await getCkbAddressFromEvm(address, client)
                setDisplayAddress(res!)
                setDisplayInternalAddress(address)
                setReady(true)
            }
        })()

        if (address?.startsWith('0x') && address?.length === 42) {
            setDisplayInternalAddress(address)
        }
    }, [address, client])

    return <>
        {
            ready &&
            <UserProvider address={displayAddress!}>
                {
                    displayInternalAddress
                        ? <InternalProfile internalAddress={displayInternalAddress}/>
                        : <Profile/>
                }
            </UserProvider>
        }
    </>
}
