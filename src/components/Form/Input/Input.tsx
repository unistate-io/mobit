import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>{
    startIcon?: React.ReactNode
    endIcon?: React.ReactNode
}

export default function Input({startIcon, endIcon, ...props}: InputProps) {
    return <div className="rounded-xl bg-[#F8F9F8] flex flex-row  items-center px-4">
        {
            !!startIcon && <div className="mr-2 flex flex-row items-center">{startIcon}</div>
        }
        <input className="rounded-xl outline-0 flex-1 bg-inherit py-4 text-4" {...props }/>
        {
            !!endIcon && <div className="ml-2">{endIcon}</div>
        }
    </div>
}
