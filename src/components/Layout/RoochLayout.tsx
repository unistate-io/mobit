import React, {useLayoutEffect} from 'react'
import {useLocation} from "react-router-dom"
import Header from "@/components/Rooch/Header/Header"
import Feedback from "@/components/Feedback"
import {KeepAliveOutlet} from 'react-alive-outlet'
import CKBProvider from "@/providers/CKBProvider/CKBProvider"
import RoochProvider from "@/providers/RoochProvider/RoochProvider"

function Home() {
    const location = useLocation()

    useLayoutEffect(() => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
        scrollTop && window.scrollTo(0, 0)
    }, [location.pathname])

    return (
        <RoochProvider>
            <div className="App">
                <CKBProvider>
                    <Header/>
                </CKBProvider>
                <div>
                    <KeepAliveOutlet/>
                </div>
                <Feedback/>
            </div>
        </RoochProvider>
    )
}

export default Home;
