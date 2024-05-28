export const showAddress = (address: string) => {
    return address.slice(0, 6) + "..." + address.slice(-4)
}

export default function AddressCapsule({label, address}: { label?: string, address: string }) {
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return <div
        onClick={() => handleCopy(address)}
        className="inline-flex items-center space-x-2 bg-gray-200 px-7 py-3 rounded-3xl mr-5 cursor-pointer">
        {!!label &&
            <div className="text-xl text-gray-400">{label}: </div>
        }

        <div className="text-xl text-gray-400">{showAddress(address)}</div>

        <i className="uil-copy text-gray-400 text-xl" />
    </div>
}
