import Input from '@/components/Form/Input/Input'
import TokenIcon from '@/components/TokenIcon/TokenIcon'
import { LangContext } from '@/providers/LangProvider/LangProvider'
import * as Dialog from '@radix-ui/react-dialog'
import { Token } from '@utxoswap/swap-sdk-js'
import { useContext, useMemo, useState } from "react"

export interface SelectOption {
    label: string
    id: string,
    token: Token
}

interface Props {
    value: Token | null
    className?: string
    options?: SelectOption[]
    onChange: (option: Token) => void
}



export const DialogExchange = ({ className, value, options = [], onChange }: Props) => {
    const [open, setOpen] = useState(false)
    const { lang } = useContext(LangContext)

    const [searchWord, setSearchWord] = useState("")

    const handleInput = (e: any) => setSearchWord(e.target.value)

    const handleSelect = (token: Token) => {
        onChange(token)
        setOpen(false)
    }

    const filteredOptions = useMemo(() => {
        return options.filter(option => option.token?.symbol.toLowerCase().includes(searchWord.toLowerCase()) || option.token?.name?.toLowerCase().includes(searchWord.toLowerCase()))
    }, [options, searchWord])

    return <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={`${className} flex h-[56px] items-center w-[220px] bg-gray-100 px-3 py-3 rounded-xl justify-between`}>
            {value ? <div className='flex flex-row items-center gap-[12px]'>
                {value.logo ? <img src={value.logo} className='w-[48px] h-[48px]' /> : <TokenIcon symbol={value.symbol} size={48} className='mr-[0px]' />}
                <div className='font-bold text-2xl text-[#272928]'>{value.symbol}</div>
            </div> : lang["Select..."]}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
            >
                <path
                    d="M17.92 11.6199C17.8724 11.4972 17.801 11.385 17.71 11.2899L12.71 6.28994C12.6168 6.1967 12.5061 6.12274 12.3842 6.07228C12.2624 6.02182 12.1319 5.99585 12 5.99585C11.7337 5.99585 11.4783 6.10164 11.29 6.28994C11.1968 6.38318 11.1228 6.49387 11.0723 6.61569C11.0219 6.73751 10.9959 6.86808 10.9959 6.99994C10.9959 7.26624 11.1017 7.52164 11.29 7.70994L14.59 10.9999H7C6.73478 10.9999 6.48043 11.1053 6.29289 11.2928C6.10536 11.4804 6 11.7347 6 11.9999C6 12.2652 6.10536 12.5195 6.29289 12.707C6.48043 12.8946 6.73478 12.9999 7 12.9999H14.59L11.29 16.2899C11.1963 16.3829 11.1219 16.4935 11.0711 16.6154C11.0203 16.7372 10.9942 16.8679 10.9942 16.9999C10.9942 17.132 11.0203 17.2627 11.0711 17.3845C11.1219 17.5064 11.1963 17.617 11.29 17.7099C11.383 17.8037 11.4936 17.8781 11.6154 17.9288C11.7373 17.9796 11.868 18.0057 12 18.0057C12.132 18.0057 12.2627 17.9796 12.3846 17.9288C12.5064 17.8781 12.617 17.8037 12.71 17.7099L17.71 12.7099C17.801 12.6148 17.8724 12.5027 17.92 12.3799C18.02 12.1365 18.02 11.8634 17.92 11.6199Z"
                    fill="black"
                />
            </svg>
        </Dialog.Trigger>

        <Dialog.Portal>
            <Dialog.Overlay
                className="bg-[rgba(0,0,0,0.6)] z-40 data-[state=open]:animate-overlayShow fixed inset-0" />
            <Dialog.Content
                onPointerDownOutside={e => { e.preventDefault() }}
                className="data-[state=open]:animate-contentShow z-50 fixed top-[50%] left-[50%] p-6 max-w-[98vw] w-full md:max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none">
                <div className="flex flex-row justify-between items-center mb-6">
                    <div className="font-medium text-xl text-[#272928]">{lang['Select a token']}</div>
                    <div onClick={e => {
                        setOpen(false)
                    }}
                        className="flex flex-row items-center justify-center text-xl cursor-pointer h-[24px] w-[24px] rounded-full bg-gray-100">
                        <i className="uil-times text-gray-500" />
                    </div>
                </div>

                <Input className='h-[50px]' startIcon={<i className="uil-search text-black" />} onChange={handleInput} />

                <div className="mt-6 flex flex-col gap-1">
                    <span className='text-[#7B7C7B] text-sm'>{lang['All Token']}</span>
                    <div className='flex flex-col gap-4 overflow-scroll max-h-[400px]'>
                        {
                            filteredOptions.map(({ token }) => {
                                return <div className='flex gap-[6px] items-center cursor-pointer' onClick={() => handleSelect(token)}>
                                    {token.logo ? <img src={token.logo} className='w-[30px] h-[30px]' /> : <TokenIcon symbol={token.symbol} size={30} className='mr-[0px]' />}
                                    <div className='flex flex-col'>
                                        <span className='text-xl text-[#272928] font-semibold	'>{token.name}</span>
                                        <span className='text-[#7B7C7B] text-sm'>{token.symbol}</span>
                                    </div>
                                </div>
                            })
                        }
                    </div>
                </div>
            </Dialog.Content>
        </Dialog.Portal>
    </Dialog.Root>

}