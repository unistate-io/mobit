import {useEffect, useMemo, useState, useContext} from 'react'
import Select from "@/components/Select/Select"
import BigNumber from "bignumber.js"
import {toDisplay} from "@/utils/number_display"
import {LangContext} from "@/providers/LangProvider/LangProvider"

export default function NetWorth(props: { usd: string, status: 'loading' | 'complete' | 'error' }) {
    const [currency, setCurrency] = useState<'usd' | 'cny'>('usd')
    const [cnyRate, setCnyRate] = useState(0)
    const [queryStatus, setQueryStatus] = useState<'loading' | 'complete' | 'error'>('loading')
    const {lang} = useContext(LangContext)

    useEffect(() => {
        setQueryStatus('loading')
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
            .then(res => res.json())
            .then(res => {
                setCnyRate(res.rates.CNY)
                setQueryStatus('complete')
            })
            .catch(() => {
                setQueryStatus('error')
            })
    }, []);


    const symbol = useMemo(() => {
        return currency === 'usd' ? '$' : '¥'
    }, [currency])

    const value = useMemo(() => {
        return currency === 'usd' ? toDisplay(BigNumber(props.usd).toString(), 0, true, 2) : toDisplay(BigNumber(props.usd).times(cnyRate).toString(), 0, true, 2)
    }, [currency, props.usd, cnyRate])

    return <div className='min-w-[190px] shadow bg-white p-4 rounded-lg'>
        <div className="text-xs mb-2 flex flex-row items-center justify-between">
            <div>{lang['Net Worth']}</div>
            <div className="w-[40px]">
                <Select
                    icon={<svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M4.38573 5.53233C4.18573 5.77481 3.81426 5.77481 3.61427 5.53233L0.344665 1.56814C0.0756859 1.24202 0.307659 0.75 0.730393 0.75L7.26961 0.750001C7.69234 0.750001 7.92431 1.24202 7.65533 1.56814L4.38573 5.53233Z"
                            fill="#272928"/>
                    </svg>}
                    defaultValue={'usd'}
                    options={[
                        {id: 'usd', label: `USD`},
                        {id: 'cny', label: `CNY`},
                    ]}
                    onValueChange={(value: any) => {
                        setCurrency(value)
                    }}
                />
            </div>
        </div>
        {props.status !== 'loading' && queryStatus !== 'loading'
            ? <div className="text-lg sm:text-2xl font-semibold">{symbol}{value}</div>
            : <div className="loading-bg h-[32px] rounded-lg"/>
        }
    </div>
}
