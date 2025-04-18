import {useContext, useEffect} from 'react'
import {toDisplay} from "@/utils/number_display"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import useNervdao from "@/serves/useNervdao"

interface NervdaoBalanceProps {
    walletAddress: string;
    className?: string;
}

export default function NervdaoBalance({walletAddress, className = ''}: NervdaoBalanceProps) {
    const {lang} = useContext(LangContext)
    const {getDepositedCkb, depositedCkb, status} = useNervdao()

    useEffect(() => {
        if (walletAddress) {
            getDepositedCkb(walletAddress)
        }
    }, [walletAddress])

    const formattedBalance = toDisplay(depositedCkb.toString(), 8, false, 8)

    return (
        <div className={`shadow bg-white p-4 rounded-lg ${className}`}>
            <div className="text-xs mb-2 flex flex-row items-center justify-between">
                <div className="flex items-center">
                    <img src="/images/nervdao_logo.svg" alt="Nervdao" className="w-4 h-4 mr-2 bg-black" />
                    <span>{lang["Nervdao Deposited"]}</span>
                </div>
                <a href="https://www.nervdao.com" target="_blank" rel="noopener noreferrer" 
                    className="flex flex-row items-center text-blue-500 hover:underline">
                    <span>{lang["View on Nervdao"]} </span>
                    <i className="uil uil-arrow-right text-lg" />
                </a>
            </div>
            {status !== 'loading' ? (
                <div className="text-lg sm:text-xl font-semibold">{formattedBalance} CKB</div>
            ) : (
                <div className="loading-bg h-[32px] rounded-lg"/>
            )}
        </div>
    )
}
