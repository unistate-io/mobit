import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/Layout/Layout"
import Home from "@/pages/Home/Home"
import ProfilePage from "@/pages/Profile";
import MarketPage from "@/pages/Market";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <div>error</div>,
        children: [
            { path: "/", element: <MarketPage /> },
            { path: "/address/:address", element: <ProfilePage /> },
            { path: "/market", element: <MarketPage /> },
        ]
    },
]);

export default router
