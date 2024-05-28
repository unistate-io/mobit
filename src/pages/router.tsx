import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/Layout/Layout"
import Home from "@/pages/Home/Home"
import ProfilePage from "@/pages/Profile";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        errorElement: <div>error</div>,
        children: [
            { path: "/", element: <Home /> },
            { path: "/address/:address", element: <ProfilePage /> },
        ]
    },
]);

export default router
