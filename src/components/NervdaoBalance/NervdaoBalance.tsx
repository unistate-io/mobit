import {useContext, useEffect} from 'react'
import {toDisplay} from "@/utils/number_display"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import useNervdao from "@/serves/useNervosdao"

interface NervdaoBalanceProps {
    walletAddresses: string[];
    className?: string;
}

export default function NervdaoBalance({walletAddresses, className = ''}: NervdaoBalanceProps) {
    const {lang} = useContext(LangContext)
    const {getDepositedCkb, depositedCkb, status, redeemingCkb} = useNervdao()

    useEffect(() => {
        if (walletAddresses.length > 0) {
            getDepositedCkb(walletAddresses)
        }
    }, [walletAddresses])

    const formattedBalance = toDisplay(depositedCkb.toString(), 8, false, 8)
    const formattedRedeemingBalance = toDisplay(redeemingCkb.toString(), 8, false, 8)

    return (
        <div className={`shadow bg-white p-4 rounded-lg ${className}`}>
            <div className="text-xs mb-2 flex flex-row items-center justify-between">
                <div className="flex items-center text-xl font-semibold mb-3">
                    <img src="/images/nervdao_logo.svg" alt="Nervdao" className="w-6 h-6 mr-2 bg-black" />
                    <span>Nervos DAO</span>
                </div>
                <a href="https://www.nervdao.com" target="_blank" rel="noopener noreferrer" 
                    className="flex flex-row items-center text-blue-500 hover:underline">
                    <span>{lang["View on Nervdao"]} </span>
                    <i className="uil uil-arrow-right text-lg" />
                </a>
            </div>
            {status !== 'loading' ? (
                <div className="flex flex-row items-center flex-wrap gap-4">
                    <div className="text-lg sm:text-xl font-semibold flex-1">
                        <span className="text-gray-500 text-sm mr-2 font-normal">{lang['Deposited']}</span> 
                        {formattedBalance} CKB
                        </div>
                    <div className="text-lg sm:text-xl font-semibold flex-1">
                        <span className="text-gray-500 text-sm mr-2 font-normal">{lang['Redeeming']}</span> 
                        {formattedRedeemingBalance} CKB
                        </div>
                </div>
            ) : (
                <div className="loading-bg h-[32px] rounded-lg"/>
            )}
        </div>
    )
}
