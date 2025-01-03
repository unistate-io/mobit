import {useContext, useEffect, useMemo, useState} from 'react';
import Background from '@/components/Background/Background';
import Avatar from '@/components/Avatar/Avatar';
import ListToken, {TokenBalance} from '@/components/ListToken/ListToken';
import {ToastContext, ToastType} from '@/providers/ToastProvider/ToastProvider';
import ListDOBs from '@/components/ListDOBs/ListDOBs';
import {LangContext} from '@/providers/LangProvider/LangProvider';
import useLayer1Assets from '@/serves/useLayer1Assets';
import ProfileAddresses from '@/components/ProfileAddresses/ProfileAddresses';
import useBtcTransactionsHistory from '@/serves/useBtcTransactionsHistory';
import ListBtcHistory from '@/components/ListBtcHistory/ListBtcHistory';
import {themes} from '@/providers/UserProvider/themes';
import Button from '@/components/Form/Button/Button';

export default function BtcProfile({internalAddress}: {internalAddress: string}) {
  const {showToast} = useContext(ToastContext);
  const {lang} = useContext(LangContext);

  // ui state
  const isBtc = useMemo(() => {
    if (!internalAddress) {
      return false;
    }

    return internalAddress.startsWith('bc1') || internalAddress.startsWith('tb1');
  }, [internalAddress]);

  const {
    xudts: layer1Xudt,
    dobs: layer1Dobs,
    btc: layer1Btc,
    status: layer1DataStatus,
    error: layer1DataErr,
  } = useLayer1Assets(internalAddress && isBtc ? internalAddress : undefined);

  const {data: btcHistory, status: btcHistoryStatus} = useBtcTransactionsHistory(isBtc ? internalAddress : undefined);

  const tokensStatus = useMemo(() => {
    if (layer1DataStatus === 'loading') {
      return 'loading';
    } else if (layer1DataStatus === 'error') {
      return 'error';
    } else if (layer1DataStatus === 'complete') {
      return 'complete';
    }

    return 'loading';
  }, [layer1DataStatus]);

  const tokenData = useMemo(() => {
    if (tokensStatus === 'loading' || tokensStatus === 'error') {
      return [] as TokenBalance[];
    } else {
      return layer1Btc ? [layer1Btc, ...layer1Xudt] : [...layer1Xudt];
    }
  }, [layer1Btc, layer1Xudt, tokensStatus]);

  useEffect(() => {
    if (layer1DataErr) {
      console.error('layer1DataErr', layer1DataErr);
      showToast(layer1DataErr.message, ToastType.error);
    }
  }, [layer1DataErr]);

  const tabs = useMemo(() => {
    return [
      {
        value: 'All',
        label: lang['All'],
      },
      {
        value: 'Tokens',
        label: lang['Tokens'],
      },
      {
        value: 'DOBs',
        label: lang['DOBs'],
      },
      {
        value: 'Activity',
        label: lang['Activity'],
      },
    ];
  }, [lang]);

  const [currtab, setCurrTab] = useState('All');

  return (
    <div>
      <Background gradient={themes[0].bg} />
      <div className="max-w-[--page-with] mx-auto px-3 pb-10">
        <div className="w-[200px] h-[200px] rounded-full overflow-hidden mt-[-100px] border-4 border-white hidden md:block">
          <Avatar size={200} name={internalAddress || 'default'} colors={themes[0].colors} />
        </div>
        <div className="w-[128px] h-[128px] rounded-full overflow-hidden mt-[-64px] mx-auto border-4 border-white md:hidden">
          <Avatar size={128} name={internalAddress || 'default'} colors={themes[0].colors} />
        </div>
        <div className="mt-4 flex flex-col items-center md:flex-row">
          <div className="mb-4 md:mr-6">
            <ProfileAddresses addresses={[internalAddress]} defaultAddress={internalAddress!} />
          </div>
        </div>

        <div className="flex flex-row items-center mt-3 lg:mt-9 w-full overflow-auto">
          {tabs.map(tab => {
            return (
              <Button
                key={tab.value}
                onClick={() => setCurrTab(tab.value)}
                className={`!w-auto bg-white h-10 !font-bold outline-none cursor-pointer py-2 px-4 rounded-lg ${tab.value === currtab ? ' text-white !bg-black' : ''}`}
                value={tab.value}
              >
                {tab.label}
              </Button>
            );
          })}
        </div>
        <div className="flex justify-between flex-col lg:flex-row">
          <div className={`flex-1 lg:max-w-[780px] ${currtab !== 'Activity' ? 'block' : 'hidden'}`}>
            <div className={`mt-4 ${currtab === 'All' || currtab === 'Tokens' ? 'block' : 'hidden'}`}>
              <ListToken
                data={tokenData}
                status={tokensStatus}
                internalAddress={internalAddress}
                addresses={undefined}
              />
            </div>
            <div className={`mt-6 ${currtab === 'All' || currtab === 'DOBs' ? 'block' : 'hidden'}`}>
              <ListDOBs data={[...layer1Dobs]} status={tokensStatus} loaded={true} onChangePage={page => {}} />
            </div>
          </div>
          <div className={`w-full mt-4 ${currtab === 'Activity' ? 'block' : 'hidden'}`}>
            <div className="shadow rounded-lg bg-white py-4">
              <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
                <div className="text-xl font-semibold">{lang['Activity']}</div>
              </div>
              <ListBtcHistory internalAddress={internalAddress!} data={btcHistory} status={btcHistoryStatus} />
            </div>
          </div>

          <div className={`lg:max-w-[380px] flex-1 mt-4 ${currtab !== 'Activity' ? 'block' : 'hidden'}`}>
            <div className="shadow rounded-lg bg-white py-4">
              <div className="flex justify-between flex-row items-center px-2 md:px-4 mb-3">
                <div className="text-xl font-semibold">{lang['Activity']}</div>
              </div>

              <ListBtcHistory
                pageSize={5}
                internalAddress={internalAddress!}
                data={btcHistory}
                status={btcHistoryStatus}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
