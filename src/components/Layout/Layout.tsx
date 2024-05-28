import React from 'react';
import {Outlet} from "react-router-dom";
import Header from "@/components/Header/Header"

function Home() {
    return (
        <div className="App">
            <Header/>
            <div>
                <Outlet/>
            </div>
        </div>
    )
}

export default Home;
