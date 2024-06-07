import {useContext, useState} from 'react'
import {TokenInfo} from "@/utils/graphql/types"
import TokenIcon from "@/components/TokenIcon/TokenIcon"
import Button from "@/components/Form/Button/Button"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import DialogXudtReceive from "@/components/Dialogs/DialogXudtReceive/DialogXudtReceive"
import DialogCkbTransfer from "@/components/Dialogs/DialogCkbTransfer/DialogCkbTransfer"
import useCkbBalance from "@/serves/useCkbBalance"
import {toDisplay} from "@/utils/number_display"
import useTransactions from "@/serves/useTransactionsHistory"
import ListTokenHistory from "@/components/ListTokenHistory/ListTokenHistory";

const CkbInfo: TokenInfo = {
    decimal: 8,
    name: 'Nervos CKB',
    symbol: 'CKB',
    transaction_hash: '',
    transaction_index: '',
    type_id: ''
}

export default function TokenPage() {
    const {signer, open, address} = useContext(CKBContext)

    const [tokenInfo, setTokenInfo] = useState(CkbInfo)
    const {data: ckbBalabce, status: ckbBalanceStatue} = useCkbBalance(address)
    const {data: historyData, status: historyDataStatus} = useTransactions(address, 10)

    return <div className="max-w-[1044px] mx-auto px-3 py-8 flex flex-col sm:flex-row items-start">
        <div
            className="sm:w-[320px] w-full shadow rounded-lg overflow-hidden bg-[url('./assets/token_bg.png')] bg-[length:100%_auto] bg-no-repeat p-5">
            <div className="mt-10 mb-4">
                <TokenIcon symbol={tokenInfo?.symbol || 'default'} size={90} rounded={false}/>
            </div>
            <div className="text-lg mb-4 flex flex-row items-baseline">
                <div className="font-semibold mr-3 text-2xl"> {tokenInfo.symbol}</div>
                <div className="text-sm"> {tokenInfo.name}</div>
            </div>

            {!signer &&
                <div className="flex flex-row justify-between text-sm">
                    <Button className="mr-2" onClick={open}>Send</Button>
                    <Button className="text-white !bg-[#000] hover:opacity-80 hover:bg-[#000]"
                            onClick={open}>Receive</Button>
                </div>
            }

            {signer && address &&
                <>
                    {ckbBalanceStatue === 'loading' &&
                        <div className={'loading-bg h-[30px] mb-3 rounded-lg'}/>
                    }

                    {ckbBalanceStatue === 'complete' &&
                        <div className={'flex flex-row justify-between h-[30px] mb-3'}>
                            <div>Balance</div>
                            <div className="font-semibold text-xl">{toDisplay(ckbBalabce?.amount || '0', 8, true)} CKB
                            </div>
                        </div>
                    }

                    <div className="flex flex-row justify-between text-sm">
                        <DialogCkbTransfer from={address!} className="flex-1 mr-2">
                            <Button onClick={open}>Send</Button>
                        </DialogCkbTransfer>
                        <DialogXudtReceive address={address!} className="flex-1">
                            <Button className="text-white !bg-[#000] hover:opacity-80 hover:bg-[#000]"
                                    onClick={open}>Receive</Button>
                        </DialogXudtReceive>
                    </div>
                </>
            }
        </div>
        <div className="shadow flex-1 w-full mt-6 sm:mt-0 sm:ml-6 rounded-lg px-5 py-3">
            <div className="font-semibold text-lg mb-4">Transactions</div>

            <ListTokenHistory data={historyData} status={historyDataStatus} address={address!} />
        </div>
    </div>
}
