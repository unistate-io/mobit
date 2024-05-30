import UserProvider from "@/providers/UserProvider/UserProvider";
import {useParams} from "react-router-dom";
import Profile from "@/pages/Profile/Profile";

export default function ProfilePage() {
    const {address} = useParams()

    return <UserProvider address={address!}>
        <Profile/>
    </UserProvider>
}
