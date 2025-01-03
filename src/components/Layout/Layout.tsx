import React, {useLayoutEffect} from 'react';
import {useLocation} from 'react-router-dom';
import Header from '@/components/Header/Header';
import CKBProvider from '@/providers/CKBProvider/CKBProvider';
import Feedback from '@/components/Feedback';
// @ts-ignore
import {KeepAliveOutlet} from 'react-alive-outlet';

function Home() {
    const location = useLocation();

    useLayoutEffect(() => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        scrollTop && window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <CKBProvider>
            <div className="App">
                <Header />
                <div>
                    <KeepAliveOutlet />
                </div>
                {location.pathname !== '/trade' && <Feedback />}
            </div>
        </CKBProvider>
    );
}

export default Home;
