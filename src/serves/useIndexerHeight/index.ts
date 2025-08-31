import {useContext, useEffect, useRef, useState, useCallback} from "react"
import {queryBlockHeight} from "@/utils/graphql"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {BlockHeight} from "@/utils/graphql/types"

export default function useIndexerHeight() {
    const {network} = useContext(CKBContext)
    const [status, setStatus] = useState<"loading" | "complete" | "error">("loading")
    const [data, setData] = useState<BlockHeight | undefined>(undefined)
    const [error, setError] = useState<undefined | any>(undefined)

    const historyRef = useRef("")

    const refresh = useCallback(async () => {
        try {
            const isMainnet = network === "mainnet"
            const height = await queryBlockHeight(isMainnet)

            if (height) {
                if (historyRef.current !== network) return
                setData(height)
                setStatus("complete")
                setError(undefined) // Clear any previous errors
            } else {
                // Don't expose GraphQL errors to UI, just mark as error
                setError(new Error("Failed to fetch indexer height"))
                setStatus("error")
            }
        } catch (e: any) {
            // Suppress connection errors and other technical details
            // Only create a generic error for UI handling
            const genericError = new Error("Network request failed")
            setError(genericError)
            setStatus("error")
        }
    }, [network])

    useEffect(() => {
        if (historyRef.current !== network) {
            historyRef.current = network
            setStatus("loading")
            setData(undefined)
            setError(undefined)
            refresh()
        }
    }, [network, refresh])

    // Initial fetch when component mounts
    useEffect(() => {
        if (network && !historyRef.current) {
            refresh()
        }
    }, [refresh, network])

    return {
        data,
        status,
        error: undefined, // Always return undefined error to prevent UI error messages
        refresh
    }
}
