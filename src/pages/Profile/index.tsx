import UserProvider from "@/providers/UserProvider/UserProvider";
import {useParams} from "react-router-dom";
import Profile from "@/pages/Profile/Profile";
import {useEffect} from "react";

export default function ProfilePage() {
    const {address} = useParams()

    useEffect(() => {
        console.log('address change', address)
    }, [address])

    return <UserProvider address={address!}>
        <Profile/>
    </UserProvider>
}
