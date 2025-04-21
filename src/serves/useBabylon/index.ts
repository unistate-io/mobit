import { useState, useContext } from "react"
import { CKBContext } from "@/providers/CKBProvider/CKBProvider"


interface BabylonStatus {
    active_tvl: number
    active_delegations: number
    unbonding_tvl: number
    unbonding_delegations: number
    withdrawable_tvl: number
    withdrawable_delegations: number
    slashed_tvl: number
    slashed_delegations: number
}

export default function useBabylon() {
    const {network} = useContext(CKBContext)
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [babylonStatus, setBabylonStatus] = useState<BabylonStatus>({
        active_tvl: 0,
        active_delegations: 0,
        unbonding_tvl: 0,
        unbonding_delegations: 0,
        withdrawable_tvl: 0,
        withdrawable_delegations: 0,
        slashed_tvl: 0,
        slashed_delegations: 0
    })

    const getBabylonStatus = async (walletAddress: string) => {
        if (!walletAddress) {
            setStatus("success")
            return
        }
        
        setStatus("loading")
        try {
            const response = await fetch(`${process.env.REACT_APP_MARKET_API}/api/babylon/status?address=${walletAddress}&network=${network}`)
            if (!response.ok) {
                throw new Error('Failed to fetch Babylon status')
            }
            const data = await response.json()
            setBabylonStatus(data)
            setStatus("success")
        } catch (error) {
            console.error('Error fetching Babylon status:', error)
            setStatus("error")
        }
    }

    return {
        getBabylonStatus,
        babylonStatus,
        status
    }
} 