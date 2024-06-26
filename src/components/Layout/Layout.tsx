import React from 'react'
import {Outlet} from "react-router-dom"
import Header from "@/components/Header/Header"
import CKBProvider from "@/providers/CKBProvider/CKBProvider"

function Home() {
    return (
        <CKBProvider>
            <div className="App">
                <Header/>
                <div>
                    <Outlet/>
                </div>
            </div>
        </CKBProvider>
    )
}

export default Home;
