import {useContext, useEffect, useState} from "react"
import {tokenInfoToScript, TokenInfoWithAddress} from "@/utils/graphql/types"
import {Cell, config as lumosConfig, helpers, Indexer} from "@ckb-lumos/lumos"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {hashType} from "@/serves/useXudtTransfer/lib"
import {CkbHelper, convertToTransaction, createMergeXudtTransaction, createBurnXudtTransaction} from "mobit-sdk"
import {ccc} from "@ckb-ccc/connector-react"

export default function useGetXudtCell(tokenInfo?: TokenInfoWithAddress, addresses?: string[]) {
    const {config, network, signer} = useContext(CKBContext)
    const [data, setData] = useState<Cell[]>([])
    const [status, setStatus] = useState<"loading" | "error" | "complete">("loading")
    const [error, setError] = useState<any | null>(null)

    useEffect(() => {
        if (!tokenInfo || !addresses || addresses.length === 0) {
            setStatus("complete")
            setError(null)
            setData([])
            return
        }

        ;(async () => {
            setStatus("loading")

            const indexer = new Indexer(config.ckb_indexer, config.ckb_rpc)
            const scriptConfig = network === "mainnet" ? lumosConfig.MAINNET : lumosConfig.TESTNET
            const senderLocks = addresses.map(address => {
                return helpers.addressToScript(address, {config: scriptConfig})
            })

            const typeScript: any = {
                codeHash: tokenInfo.address_by_type_address_id?.script_code_hash.replace("\\", "0") ?? "",
                hashType: hashType[tokenInfo.address_by_type_address_id?.script_hash_type ?? 0],
                args: tokenInfo.address_by_type_address_id?.script_args.replace("\\", "0") ?? ""
            }

            let collected: Cell[] = []

            try {
                for (const lock of senderLocks) {
                    const collector = indexer.collector({lock: lock, type: typeScript})
                    for await (const cell of collector.collect()) {
                        collected.push(cell)
                    }
                }

                setData(collected)
                setStatus("complete")
            } catch (e) {
                console.warn(e)
                setStatus("error")
                setData([])
                setError(e)
            }
        })()
    }, [tokenInfo, addresses, config.ckb_indexer, config.ckb_rpc, network])

    const createMergeXudtCellTx = async (feeRate: ccc.NumLike) => {
        if (!tokenInfo || !addresses || !addresses.length || !signer) return null

        const ckbHelper = new CkbHelper(network === "mainnet")
        const xudtType = tokenInfoToScript(tokenInfo)
        if (!xudtType) return null

        let tx = await createMergeXudtTransaction(
            {
                xudtType,
                ckbAddresses: addresses,
                collector: ckbHelper.collector,
                isMainnet: network === "mainnet"
            },
            addresses[0]
        )

        let txSkeleton = convertToTransaction(tx)
        await txSkeleton.completeFeeBy(signer, feeRate)
        console.log("txSkeleton", txSkeleton)
        return txSkeleton
    }

    const createBurnXudtCellTx = async (burnAmount: bigint, feeRate: ccc.NumLike) => {
        if (!tokenInfo || !addresses || !addresses.length || burnAmount === BigInt(0) || !signer) return null
        const ckbHelper = new CkbHelper(network === "mainnet")
        const xudtType = tokenInfoToScript(tokenInfo)
        if (!xudtType) return null

        let tx = await createBurnXudtTransaction({
            xudtType,
            ckbAddress: addresses[0],
            burnAmount: burnAmount,
            collector: ckbHelper.collector,
            isMainnet: network === "mainnet"
        })

        const txSkeleton = convertToTransaction(tx)
        await txSkeleton.completeFeeBy(signer, feeRate)

        console.log("txSkeleton", txSkeleton)
        return txSkeleton
    }

    const signAndSend = async (tx: ccc.Transaction) => {
        if (!tokenInfo || !addresses || !addresses.length) return null

        if (!signer) {
            throw new Error("Please connect wallet first.")
        }

        console.log("signer", signer)

        const hash = await signer.sendTransaction(tx)
        return hash
    }

    return {
        data,
        status,
        error,
        createMergeXudtCellTx,
        createBurnXudtCellTx,
        signAndSend
    }
}
