import {createBrowserRouter} from "react-router-dom"
import CkbLayout from "@/components/Layout/CkbLayout"
import ProfilePage from "src/pages/CKB/Profile"
import MarketPage from "src/pages/CKB/Market"
import Apps from "src/pages/CKB/Apps"
import Dob from "src/pages/CKB/Dob"
import TokenPage from "src/pages/CKB/Token"
import CkbTokenPage from "src/pages/CKB/CkbToken"
import BtcTokenPage from "src/pages/CKB/BtcToken"
import Test from "@/pages/Test"
import DotBit from "@/pages/CKB/DotBit/DotBit"
import TradePage from "src/pages/CKB/Trade"
import RoochProfilePage from "@/pages/Rooch/Profile"

import RoochLayout from "@/components/Layout/RoochLayout"
import RoochMarket from '@/pages/Rooch/Market'

const router = createBrowserRouter([
    {
        path: "/",
        element: <CkbLayout/>,
        children: [
            {path: "/", element: <MarketPage showActions={false}/>}
        ]
    },
    {
        path: "/ckb",
        element: <CkbLayout/>,
        errorElement: <div>error</div>,
        children: [
            {path: "/ckb", element: <MarketPage/>},
            {path: "/ckb/address/:address", element: <ProfilePage/>},
            {path: "/ckb/market", element: <MarketPage/>},
            {path: "/ckb/apps", element: <Apps/>},
            {path: "/ckb/dob/:tokenid", element: <Dob/>},
            {path: "/ckb/token/:tokenid", element: <TokenPage/>},
            {path: "/ckb/token", element: <CkbTokenPage/>},
            {path: "/ckb/bitcoin", element: <BtcTokenPage/>},
            {path: "/ckb/test", element: <Test/>},
            {path: "/ckb/dotbit/:domain", element: <DotBit/>},
            {path: "/ckb/trade", element: <TradePage/>}
        ]
    },
    {
        path: "/rooch",
        element: <RoochLayout/>,
        errorElement: <div>error</div>,
        children: [
            {path: "/rooch", element: <RoochMarket/>},
            {path: "/rooch/market", element: <RoochMarket/>},
            {path: "/rooch/address/:address", element: <RoochProfilePage/>},
        ]
    }
])

export default router
