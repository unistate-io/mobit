import UserProvider from "@/providers/UserProvider/UserProvider"
import {useParams} from "react-router-dom"
import InternalProfile from "./InternalProfile"
import {useEffect, useState} from "react"
import {ccc} from "@ckb-ccc/connector-react"
import {getCkbAddressFromEvm} from "@/utils/common";

export default function ProfilePage() {
    const {internalAddress} = useParams()
    const {client} = ccc.useCcc()
    const [address, setAddresss] = useState('')

    if (!internalAddress) {
        throw new Error('internalAddress is required')
    }

    useEffect(() => {
        (async () => {
            if (internalAddress.startsWith('0x') && internalAddress.length === 42) {
                const res = await getCkbAddressFromEvm(internalAddress, client)
                setAddresss(res!)
            }
        })()
    }, [internalAddress])

    return address? <UserProvider address={address!}>
        <InternalProfile internalAddress={internalAddress} />
    </UserProvider> : <></>
}
