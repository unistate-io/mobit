import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/app.scss';
import {RouterProvider} from "react-router-dom";
import router from "./pages/router";
import {ccc} from "@ckb-ccc/connector-react";
import LangProvider from "@/providers/LangProvider/LangProvider";
import ToastProvider from "@/providers/ToastProvider/ToastProvider";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

const preferNetwork = localStorage.getItem('ckb_network') || 'mainnet';
root.render(
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
);
