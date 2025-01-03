import {useContext, useMemo} from 'react';
import {CKBContext} from '@/providers/CKBProvider/CKBProvider';
import {BtcHelper, CkbHelper, prepareLeapUnsignedPsbt, leapFromBtcToCkbCombined} from 'mobit-sdk';
import {DataSource, NetworkType} from 'rgbpp/btc';
import useBtcWallet from '@/serves/useBtcWallet';

export default function useLeapXudtToLayer2() {
  const {network, internalAddress} = useContext(CKBContext);
  const {isBtcWallet, getSignPsbtWallet, feeRate} = useBtcWallet();

  const btcHelper = useMemo(() => {
    if (!isBtcWallet) return null;
    const wallet = getSignPsbtWallet()!;
    return new BtcHelper(wallet, network === 'mainnet' ? 0 : 1, network !== 'mainnet' ? 'Testnet3' : undefined);
  }, [network, isBtcWallet]);

  const build = async (props: {
    fromBtcAccount: string;
    toCkbAddress: string;
    xudtType: CKBComponents.Script;
    amount: string;
  }) => {
    console.log('[build] Starting build process with props:', props);

    if (!btcHelper) {
      console.error('[build] btcHelper is not initialized');
      throw new Error('Not supported wallet');
    }

    const ckbHelper = new CkbHelper(network === 'mainnet');
    console.log('[build] Created ckbHelper with network:', network);

    const btcDataSource = new DataSource(
      btcHelper?.btcService,
      network === 'mainnet' ? NetworkType.MAINNET : NetworkType.TESTNET
    );
    console.log('[build] Created btcDataSource with network:', network === 'mainnet' ? 'MAINNET' : 'TESTNET');

    const wallet = getSignPsbtWallet()!;
    console.log('[build] Retrieved wallet instance');

    const pubkey = await wallet.getPublicKey();
    console.log('[build] Retrieved public key:', pubkey);

    try {
      const result = await prepareLeapUnsignedPsbt({
        btcService: btcHelper.btcService,
        toCkbAddress: props.toCkbAddress,
        xudtType: props.xudtType,
        transferAmount: BigInt(props.amount),
        isMainnet: network === 'mainnet',
        btcTestnetType: network !== 'mainnet' ? 'Testnet3' : undefined,
        collector: ckbHelper.collector,
        fromBtcAccount: internalAddress!,
        fromBtcAccountPubkey: pubkey,
        btcDataSource,
        btcFeeRate: feeRate,
      });
      console.log('[build] Successfully prepared leap unsigned PSBT:', result);
      return result;
    } catch (error) {
      console.error('[build] Error preparing leap unsigned PSBT:', error);
      throw error;
    }
  };

  const leap = async (props: {
    fromBtcAccount: string;
    toCkbAddress: string;
    xudtType: CKBComponents.Script;
    amount: string;
    feeRate: number;
  }) => {
    if (!btcHelper) {
      throw new Error('Not supported wallet');
    }

    const wallet = getSignPsbtWallet()!;
    return await leapFromBtcToCkbCombined(
      {
        toCkbAddress: props.toCkbAddress,
        xudtType: props.xudtType,
        transferAmount: BigInt(props.amount),
        collector: new CkbHelper(network === 'mainnet').collector,
        btcDataSource: new DataSource(
          btcHelper?.btcService,
          network === 'mainnet' ? NetworkType.MAINNET : NetworkType.TESTNET
        ),
        btcTestnetType: network !== 'mainnet' ? 'Testnet3' : undefined,
        isMainnet: network === 'mainnet',
        fromBtcAccount: internalAddress!,
        fromBtcAccountPubkey: await wallet.getPublicKey(),
        wallet: wallet,
        btcService: btcHelper.btcService,
      },
      props.feeRate
    );
  };

  return {
    build,
    leap,
  };
}
