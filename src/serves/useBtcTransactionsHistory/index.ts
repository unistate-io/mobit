import { RgbppSDK } from "mobit-sdk";
import { useEffect, useState } from "react";

export const getBtcTransactionsHistory = async (address: string) => {
    const sdk = new RgbppSDK(true);
    const res = await sdk.fetchTxsDetails(address);
    return res;
};

export default function useBtcTransactionsHistory(
    address?: string,
    pageSize?: number,
) {
    const [data, setData] = useState<BtcTransaction[]>([]);
    const [status, setStatus] = useState<"loading" | "complete" | "error">(
        "loading",
    );
    const [error, setError] = useState<undefined | any>(undefined);
    const [page, setPage] = useState(1);
    const size = pageSize || 5;

    useEffect(() => {
        if (!address) {
            setData([]);
            setStatus("complete");
            setError(undefined);
            return;
        }

        (async () => {
            try {
                const res = await getBtcTransactionsHistory(address);
                const _res = res.slice(0, size);
                setData(_res);
                setStatus("complete");
            } catch (e: any) {
                console.warn(e);
                setData([]);
                setStatus("error");
                setError(e);
            }
        })();
    }, [address, size]);

    return {
        setPage,
        page,
        data,
        status,
        error,
    };
}

export interface BtcTransaction {
    txid: string;
    version: number;
    locktime: number;
    vin: Vin[];
    vout: Vout[];
    size: number;
    weight: number;
    fee: number;
    status: {
        confirmed: boolean;
        block_height: number;
        block_hash: string;
        block_time: number;
    };
}

export interface Vin {
    txid: string;
    vout: number;
    prevout: {
        scriptpubkey: string;
        scriptpubkey_asm: string;
        scriptpubkey_type: string;
        scriptpubkey_address: string;
        value: number;
    };
    scriptsig: string;
    scriptsig_asm: string;
    witness: string[];
    is_coinbase: boolean;
    sequence: number;
}

export interface Vout {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
}
