import {MarketProvider} from "@/providers/MarketProvider/MarketProvider"
import RoochProfile from "@/pages/Rooch/Profile/Profile";


export default function RoochProfilePage() {
    return <MarketProvider>
        <RoochProfile />
    </MarketProvider>
}