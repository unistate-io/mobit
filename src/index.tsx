import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/app.scss';
import {RouterProvider} from "react-router-dom";
import router from "./pages/router";
import reportWebVitals from './reportWebVitals';
import {ccc} from "@ckb-ccc/connector-react";
import LangProvider from "@/providers/LangProvider/LangProvider";
import ToastProvider from "@/providers/ToastProvider/ToastProvider";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const preferNetwork = localStorage.getItem('ckb_network') || 'mainnet';
root.render(
    <React.StrictMode>
        <LangProvider>
            <ccc.Provider
                defaultClient = {preferNetwork==='testnet'
                    ? new ccc.ClientPublicTestnet()
                    : new ccc.ClientPublicMainnet()}
                clientOptions={[
                {
                    name: "CKB Testnet",
                    client: new ccc.ClientPublicTestnet(),
                },
                {
                    name: "CKB Mainnet",
                    client: new ccc.ClientPublicMainnet(),
                },
            ]}>
                <ToastProvider>
                    <RouterProvider router={router}/>
                </ToastProvider>
            </ccc.Provider>
        </LangProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
