import { createBrowserRouter } from "react-router-dom"
import Layout from "@/components/Layout/Layout"
import ProfilePage from "@/pages/Profile"
import MarketPage from "@/pages/Market"
import Apps from '@/pages/Apps'
import Dob from '@/pages/Dob'
import TokenPage from "@/pages/Token";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <div>error</div>,
        children: [
            { path: "/", element: <MarketPage /> },
            { path: "/address/:address", element: <ProfilePage /> },
            { path: "/market", element: <MarketPage /> },
            { path: "/apps", element: <Apps /> },
            { path: "/dob/:tokenid", element: <Dob /> },
            { path: "/token/:tokenid", element: <TokenPage /> },
            { path: "/token", element: <TokenPage /> },
        ]
    },
]);

export default router
