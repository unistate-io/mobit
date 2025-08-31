import {useContext, useEffect, useRef, useState, useCallback} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {BlockHeight} from "@/utils/graphql/types"

export default function useBlockchainHeight() {
    const {config, network} = useContext(CKBContext)
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [data, setData] = useState<BlockHeight | undefined>(undefined)
    const [error, setError] = useState<undefined | any>(undefined)

    const historyRef = useRef("")

    const refresh = useCallback(async () => {
        try {
            setStatus("loading")

            // 使用直接 RPC 调用获取区块链高度
            const response = await fetch(config.ckb_rpc, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "get_tip_block_number",
                    params: [],
                    id: 1
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.error) {
                throw new Error(result.error.message || "RPC error")
            }

            // CKB RPC 返回的是十六进制字符串，转换为十进制
            const hexHeight = result.result
            const decimalHeight = parseInt(hexHeight, 16)

            const height: BlockHeight = {
                height: decimalHeight.toString()
            }

            if (historyRef.current !== config.ckb_rpc) return
            setData(height)
            setStatus("complete")
            setError(undefined) // Clear any previous errors
        } catch (e: any) {
            // Suppress RPC errors and other technical details
            // Only create a generic error for UI handling
            const genericError = new Error("Network request failed")
            setError(genericError)
            setStatus("error")
        }
    }, [config.ckb_rpc])

    useEffect(() => {
        if (config.ckb_rpc && historyRef.current !== config.ckb_rpc) {
            historyRef.current = config.ckb_rpc
            setStatus("loading")
            setData(undefined)
            setError(undefined)
            refresh()
        }
    }, [config.ckb_rpc, refresh])

    // 初始化时获取一次数据
    useEffect(() => {
        if (config.ckb_rpc && !historyRef.current) {
            refresh()
        }
    }, [refresh])

    return {
        data,
        status,
        error: undefined, // Always return undefined error to prevent UI error messages
        refresh
    }
}
