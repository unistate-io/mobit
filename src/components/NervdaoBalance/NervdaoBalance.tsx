import {useContext, useEffect} from 'react'
import {toDisplay} from "@/utils/number_display"
import {LangContext} from "@/providers/LangProvider/LangProvider"
import useNervdao from "@/serves/useNervdao"
import TokenIcon from "@/components/TokenIcon/TokenIcon"

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
            <div className="text-xs mb-2 flex flex-row items-center">
                <div className="flex items-center">
                    <TokenIcon symbol="CKB" size={16} className="mr-1" />
                    <span>Nervdao Balance</span>
                </div>
            </div>
            {status !== 'loading' ? (
                <div className="text-lg sm:text-2xl font-semibold">{formattedBalance} CKB</div>
            ) : (
                <div className="loading-bg h-[32px] rounded-lg"/>
            )}
        </div>
    )
}
