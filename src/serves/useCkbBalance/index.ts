import {useContext, useEffect, useRef, useState} from 'react';
import {TokenBalance} from '@/components/ListToken/ListToken';
import {CKBContext} from '@/providers/CKBProvider/CKBProvider';
import {ccc} from '@ckb-ccc/connector-react';

export default function useCkbBalance(addresses?: string[]) {
  const {client, network} = useContext(CKBContext);
  const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading');
  const [data, setData] = useState<TokenBalance | undefined>(undefined);
  const [error, setError] = useState<undefined | any>(undefined);

  const historyRef = useRef('');

  const refresh = async () => {
    if (!addresses || !addresses.length || !client) {
      setStatus('complete');
      return;
    }

    if (
      (addresses[0].startsWith('ckb') && network !== 'mainnet') ||
      (addresses[0].startsWith('ckt') && network !== 'testnet')
    ) {
      setStatus('complete');
      return;
    }

    try {
      let locks: ccc.Script[] = await Promise.all(
        addresses.map(async address => {
          const {script: toLock} = await ccc.Address.fromString(address, client);
          return toLock;
        })
      );

      const _balance = await client.getBalance(locks);

      setData({
        name: 'Nervos CKB',
        symbol: 'CKB',
        decimal: 8,
        type_id: '',
        type: 'ckb',
        amount: _balance.toString(),
        chain: 'ckb',
        address: {
          id: '',
          script_args: '',
          script_code_hash: '',
          script_hash_type: '',
        },
        addressByInscriptionId: null,
      } as TokenBalance);
      setStatus('complete');
    } catch (e: any) {
      setError(e);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!!addresses && addresses.length > 0 && historyRef.current !== addresses.join(',')) {
      historyRef.current = addresses.join(',');
      setStatus('loading');
      setData(undefined);
      refresh();
    }
  }, [addresses]);

  return {
    data,
    status,
    error,
    refresh,
  };
}
