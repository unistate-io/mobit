import TokenIcon from '../TokenIcon/TokenIcon'

export default function ListToken() {

    return <div className="shadow rounded-lg bg-white py-4">
        <div className="flex justify-between flex-row items-center px-4 mb-3">
            <div className="text-xl font-semibold">Token</div>
            <div className="text-xl">$12312312</div>
        </div>
        <div className="flex flex-col">
            <div className="flex flex-row flex-nowrap px-4 py-3 text-xs">
                <div className="shrink-0 basis-1/4">Asset</div>
                <div className="shrink-0 basis-1/4">Price</div>
                <div className="shrink-0 basis-1/4">Balance</div>
                <div className="shrink-0 basis-1/4 text-right">Value</div>
            </div>

            <div className="flex flex-row flex-nowrap px-4 py-3 text-xs hover:bg-gray-100">
                <div className="shrink-0 basis-1/4 flex-row flex items-center"> <TokenIcon symbol={'BTC'} size={18} />BTC</div>
                <div className="shrink-0 basis-1/4">67000</div>
                <div className="shrink-0 basis-1/4">0.2</div>
                <div className="shrink-0 basis-1/4 text-right">0.2</div>
            </div>

            <div className="flex flex-row flex-nowrap px-4 py-3 text-xs hover:bg-gray-100">
                <div className="shrink-0 basis-1/4 flex items-center"><TokenIcon symbol={'CKB'} size={18} />Nervos CKB</div>
                <div className="shrink-0 basis-1/4">67000</div>
                <div className="shrink-0 basis-1/4">0.2</div>
                <div className="shrink-0 basis-1/4 text-right">0.2</div>
            </div>
        </div>
    </div>
}
