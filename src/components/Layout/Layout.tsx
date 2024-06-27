import React from 'react'
import {Outlet} from "react-router-dom"
import Header from "@/components/Header/Header"
import CKBProvider from "@/providers/CKBProvider/CKBProvider"
// @ts-ignore
import { KeepAliveOutlet } from 'react-alive-outlet'

function Home() {
    return (
        <CKBProvider>
            <div className="App">
                <Header/>
                <div>
                    <KeepAliveOutlet/>
                </div>
            </div>
        </CKBProvider>
    )
}

export default Home;
