import {useContext, useEffect} from 'react'
import {toDisplay} from "@/utils/number_display"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import useBabylon from "@/serves/useBabylon"

interface BabylonBalanceProps {
    walletAddress: string;
    className?: string;
}

export default function BabylonBalance({walletAddress, className = ''}: BabylonBalanceProps) {
    const {lang} = useContext(LangContext)
    const {getBabylonStatus, babylonStatus, status} = useBabylon()

    useEffect(() => {
        if (walletAddress) {
            getBabylonStatus(walletAddress)
        }
    }, [walletAddress])

    const formattedStakedBalance = toDisplay(babylonStatus.active_tvl.toString(), 8, false, 8)
    const formattedUnstakingBalance = toDisplay(babylonStatus.unbonding_tvl.toString(), 8, false, 8)

    return (
        <div className={`shadow bg-white p-4 rounded-lg ${className}`}>
            <div className="text-xs mb-2 flex flex-row items-center justify-between">
                <div className="flex items-center text-xl font-semibold mb-3">
                    <img src="/images/babylon_logo.png" alt="Babylon" className="w-6 h-6 mr-2 bg-black" />
                    <span>{lang["Babylon"]}</span>
                </div>
                <a href="https://btcstaking.babylonlabs.io" target="_blank" rel="noopener noreferrer" 
                    className="flex flex-row items-center text-blue-500 hover:underline">
                    <span>{lang["View on Babylon"]} </span>
                    <i className="uil uil-arrow-right text-lg" />
                </a>
            </div>
            {status !== 'loading' ? (
                <div className="flex flex-row items-center flex-wrap gap-4">
                    <div className="text-lg sm:text-xl font-semibold flex-1">
                        <span className="text-gray-500 text-sm mr-2 font-normal">{lang['Staked']}</span> 
                        {formattedStakedBalance} BTC
                    </div>
                    <div className="text-lg sm:text-xl font-semibold flex-1">
                        <span className="text-gray-500 text-sm mr-2 font-normal">{lang['Unstaking']}</span> 
                        {formattedUnstakingBalance} BTC
                    </div>
                </div>
            ) : (
                <div className="loading-bg h-[32px] rounded-lg"/>
            )}
        </div>
    )
} 