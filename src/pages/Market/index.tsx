import TokenIcon from "@/components/TokenIcon/TokenIcon"

export default function MarketPage() {

    return <div className="max-w-[1044px] mx-auto px-3">
        <div className="flex flex-col">
            <div className="flex flex-row items-center">
                <TokenIcon symbol="BTC" size={22} /> <div>BTC</div>
            </div>
        </div>
    </div>
}
