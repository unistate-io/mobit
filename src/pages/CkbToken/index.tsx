import {useContext, useState} from 'react';
import {TokenInfo} from '@/utils/graphql/types';
import TokenIcon from '@/components/TokenIcon/TokenIcon';
import Button from '@/components/Form/Button/Button';
import {CKBContext} from '@/providers/CKBProvider/CKBProvider';
import DialogXudtReceive from '@/components/Dialogs/DialogXudtReceive/DialogXudtReceive';
import DialogCkbTransfer from '@/components/Dialogs/DialogCkbTransfer/DialogCkbTransfer';
import useCkbBalance from '@/serves/useCkbBalance';
import {toDisplay} from '@/utils/number_display';
import useTransactions from '@/serves/useTransactionsHistory';
import ListTokenHistory from '@/components/ListTokenHistory/ListTokenHistory';
import {LangContext} from '@/providers/LangProvider/LangProvider';

const CkbInfo: TokenInfo = {
  decimal: 8,
  name: 'Nervos CKB',
  symbol: 'CKB',
  transaction_hash: '',
  transaction_index: '',
  type_id: '',
};

export default function TokenPage() {
  const {signer, open, addresses} = useContext(CKBContext);
  const {lang} = useContext(LangContext);

  const [tokenInfo, setTokenInfo] = useState(CkbInfo);
  const {data: ckbBalabce, status: ckbBalanceStatue} = useCkbBalance(addresses);
  const {data: historyData, status: historyDataStatus} = useTransactions(addresses?.[0], 10);

  return (
    <div className="max-w-[--page-with] mx-auto px-3 py-8 flex flex-col sm:flex-row items-start mb-10">
      <div className="sm:w-[320px] w-full shadow rounded-lg overflow-hidden bg-[url('./assets/token_bg.png')] bg-[length:100%_auto] bg-no-repeat p-5">
        <div className="mt-10 mb-4">
          <TokenIcon symbol={tokenInfo?.symbol || 'default'} size={90} />
        </div>
        <div className="text-lg mb-4 flex flex-row items-baseline">
          <div className="font-semibold mr-3 text-2xl"> {tokenInfo.symbol}</div>
          <div className="text-sm"> {tokenInfo.name}</div>
        </div>

        {!signer && (
          <div className="flex flex-row justify-between text-sm">
            <Button className="mr-2" onClick={open}>
              Send
            </Button>
            <Button className="text-white !bg-[#000] hover:opacity-80 hover:bg-[#000]" onClick={open}>
              {lang['Receive']}
            </Button>
          </div>
        )}

        {signer && !!addresses && addresses.length > 0 && (
          <>
            {ckbBalanceStatue === 'loading' && <div className={'loading-bg h-[30px] mb-3 rounded-lg'} />}

            {ckbBalanceStatue === 'complete' && (
              <div className={'flex flex-col justify-between mb-3'}>
                <div>{lang['Balance']}</div>
                <div className="font-semibold">{toDisplay(ckbBalabce?.amount || '0', 8, true)} CKB</div>
              </div>
            )}

            <div className="flex flex-row justify-between text-sm">
              <DialogCkbTransfer froms={addresses} className="flex-1 mr-2">
                <Button>{lang['Send']}</Button>
              </DialogCkbTransfer>
              <DialogXudtReceive address={addresses[0]} className="flex-1">
                <Button className="text-white !bg-[#000] hover:opacity-80 hover:bg-[#000]">{lang['Receive']}</Button>
              </DialogXudtReceive>
            </div>
          </>
        )}
      </div>
      <div className="shadow flex-1 w-full mt-6 sm:mt-0 sm:ml-6 rounded-lg px-5 py-3">
        <div className="font-semibold text-lg mb-4">{lang['Transactions']}</div>

        <ListTokenHistory data={historyData} status={historyDataStatus} address={addresses?.[0]} />
      </div>
    </div>
  );
}
