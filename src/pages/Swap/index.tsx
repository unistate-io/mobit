import {useUtxoSwap} from "@/serves/useUtxoSwap"

export default function SwapPage() {
    const {pools} = useUtxoSwap()
    return <div>
        <div>
            {JSON.stringify(pools)}
        </div>
    </div>
}
