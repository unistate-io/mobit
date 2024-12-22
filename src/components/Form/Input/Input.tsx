import React, {forwardRef} from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    startIcon?: React.ReactNode
    endIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(({startIcon, endIcon, className, ...props}, ref) => {
    return (
        <div className={`rounded-lg bg-[#F8F9F8] flex flex-row items-center`}>
            {!!startIcon && <div className="flex flex-row items-center pl-2">{startIcon}</div>}
            <input
                className={`rounded-xl !outline-none flex-1 bg-inherit py-4 px-2 text-4 max-w-[100%] w-full ${className}`}
                {...props}
                ref={ref}
            />
            {!!endIcon && <div className="pr-4">{endIcon}</div>}
        </div>
    )
})

export default Input
