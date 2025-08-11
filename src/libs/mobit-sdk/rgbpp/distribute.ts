import { bitcoin, DataSource, sendRgbppUtxos } from "@rgbpp-sdk/btc";
import {
  BTCTestnetType,
  Collector,
  genBtcBatchTransferCkbVirtualTx,
  RgbppBtcAddressReceiver,
  serializeScript,
} from "@rgbpp-sdk/ckb";
import { BtcAssetsApi } from "rgbpp";
import { AbstractWallet, TxResult } from "../helper";
import { signAndSendPsbt } from "../wallet";

interface RgbppLockArgsListParams {
  xudtType: CKBComponents.Script;
  fromBtcAccount: string;
  btcService: BtcAssetsApi;
}

interface RgbppLockArgsListResponse {
  rgbppLockArgsList: string[];
}

export const getRgbppLockArgsList = async ({
  xudtType,
  fromBtcAccount,
  btcService,
}: RgbppLockArgsListParams): Promise<RgbppLockArgsListResponse> => {
  const type_script = encodeURIComponent(
    JSON.stringify({
      codeHash: xudtType.codeHash,
      args: xudtType.args,
      hashType: xudtType.hashType,
    }),
  );

  console.log(type_script);

  const data = await btcService.getRgbppAssetsByBtcAddress(fromBtcAccount, {
    type_script,
    no_cache: false,
  });

  console.log(data);

  // Assuming you want to return the rgbppLockArgsList based on the response
  const rgbppLockArgsList = data.map((asset) => asset.cellOutput.lock.args);

  return { rgbppLockArgsList };
};

interface RgbppDistributeParams {
  rgbppLockArgsList: string[];
  receivers: RgbppBtcAddressReceiver[];
  xudtType: CKBComponents.Script;
  collector: Collector;
  btcDataSource: DataSource;
  btcTestnetType?: BTCTestnetType;
  isMainnet: boolean;
  fromBtcAccount: string;
  fromBtcAccountPubkey: string;
  wallet: AbstractWallet;
  btcService: BtcAssetsApi;
}

const distribute = async (
  {
    rgbppLockArgsList,
    receivers,
    xudtType,
    collector,
    btcDataSource,
    btcTestnetType,
    isMainnet,
    fromBtcAccount,
    fromBtcAccountPubkey,
    wallet,
    btcService,
  }: RgbppDistributeParams,
  btcFeeRate?: number,
): Promise<TxResult> => {
  const ckbVirtualTxResult = await genBtcBatchTransferCkbVirtualTx({
    collector,
    rgbppLockArgsList,
    xudtTypeBytes: serializeScript(xudtType),
    rgbppReceivers: receivers,
    isMainnet,
    btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;

  // Send BTC tx
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: receivers.map((receiver) => receiver.toBtcAddress),
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: fromBtcAccount,
    fromPubkey: fromBtcAccountPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });

  const { txId: btcTxId } = await signAndSendPsbt(psbt, wallet, btcService);

  console.log(`BTC ${btcTestnetType} TxId: ${btcTxId}`);

  await btcService.sendRgbppCkbTransaction({
    btc_txid: btcTxId,
    ckb_virtual_result: ckbVirtualTxResult,
  });

  // TODO： 错误处理，不清楚前端怎么处理会更好一些
  try {
    const interval = setInterval(async () => {
      const { state, failedReason } = await btcService.getRgbppTransactionState(
        btcTxId,
      );
      console.log("state", state);
      if (state === "completed" || state === "failed") {
        clearInterval(interval);
        if (state === "completed") {
          const { txhash: txHash } = await btcService.getRgbppTransactionHash(
            btcTxId,
          );
          console.info(
            `Rgbpp asset has been transferred on BTC and the related CKB tx hash is ${txHash}`,
          );
        } else {
          console.warn(
            `Rgbpp CKB transaction failed and the reason is ${failedReason} `,
          );
        }
      }
    }, 30 * 1000);
  } catch (error) {
    console.error(error);
    throw error;
  }

  return { btcTxId };
};

/**
 * Interface for parameters required to distribute RGBPP assets combined.
 */
export interface RgbppDistributeCombinedParams {
  /**
   * List of receivers for the RGBPP assets.
   */
  receivers: RgbppBtcAddressReceiver[];
  /**
   * Type script for the XUDT type.
   */
  xudtType: CKBComponents.Script;
  /**
   * Collector instance used to gather cells for the transaction.
   */
  collector: Collector;
  /**
   * Data source for BTC transactions.
   */
  btcDataSource: DataSource;
  /**
   * Type of BTC testnet (optional).
   */
  btcTestnetType?: BTCTestnetType;
  /**
   * Indicates whether the operation is on the mainnet.
   */
  isMainnet: boolean;
  /**
   * BTC account from which the assets will be distributed.
   */
  fromBtcAccount: string;
  /**
   * Public key of the BTC account.
   */
  fromBtcAccountPubkey: string;
  /**
   * Wallet instance used for signing BTC transactions.
   */
  wallet: AbstractWallet;
  /**
   * Function to filter the RGBPP args list.
   */
  filterRgbppArgslist: (argsList: string[]) => Promise<string[]>;
  /**
   * BTC assets API service.
   */
  btcService: BtcAssetsApi;
}

/**
 * Distributes RGBPP assets to multiple receivers.
 *
 * @param {RgbppDistributeCombinedParams} params - The parameters for the distribution.
 * @param {RgbppBtcAddressReceiver[]} params.receivers - The list of receivers for the RGBPP assets.
 * @param {CKBComponents.Script} params.xudtType - The type script for the XUDT type.
 * @param {Collector} params.collector - The collector instance used for generating the CKB virtual transaction.
 * @param {DataSource} params.btcDataSource - The data source for BTC transactions.
 * @param {BTCTestnetType} [params.btcTestnetType] - The type of BTC testnet (optional).
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {string} params.fromBtcAccount - The BTC account from which the assets are being distributed.
 * @param {string} [params.fromBtcAccountPubkey] - The public key of the BTC account.
 * @param {AbstractWallet} params.wallet - Wallet instance used for signing BTC transactions.
 * @param {(argsList: string[]) => Promise<string[]>} params.filterRgbppArgslist - A function to filter the RGBPP args list.
 * @param {BtcAssetsApi} params.btcService - The BTC assets API service.
 * @param {number} [btcFeeRate] - The fee rate for the BTC transaction (optional).
 * @returns {Promise<TxResult>} - The result of the transaction.
 */
export const distributeCombined = async (
  {
    xudtType,
    receivers,
    collector,
    btcDataSource,
    btcTestnetType,
    isMainnet,
    fromBtcAccount,
    fromBtcAccountPubkey,
    wallet,
    filterRgbppArgslist,
    btcService,
  }: RgbppDistributeCombinedParams,
  btcFeeRate?: number,
): Promise<TxResult> => {
  const lockArgsListResponse = await getRgbppLockArgsList({
    xudtType,
    fromBtcAccount,
    btcService,
  });
  const filteredLockArgsList = await filterRgbppArgslist(
    lockArgsListResponse.rgbppLockArgsList,
  );

  const res = await distribute(
    {
      rgbppLockArgsList: filteredLockArgsList,
      receivers,
      xudtType,
      collector,
      btcDataSource,
      btcTestnetType,
      isMainnet,
      fromBtcAccount,
      fromBtcAccountPubkey,
      wallet,
      btcService,
    },
    btcFeeRate,
  );

  return res;
};

/**
 * Interface for parameters required to prepare an unsigned PSBT for distributing RGBPP assets.
 */
export interface PrepareDistributeUnsignedPsbtParams {
  /**
   * List of receivers for the RGBPP assets.
   */
  receivers: RgbppBtcAddressReceiver[];
  /**
   * Type script for the XUDT type.
   */
  xudtType: CKBComponents.Script;
  /**
   * Collector instance used to gather cells for the transaction.
   */
  collector: Collector;
  /**
   * Data source for BTC transactions.
   */
  btcDataSource: DataSource;
  /**
   * Type of BTC testnet (optional).
   */
  btcTestnetType?: BTCTestnetType;
  /**
   * Indicates whether the operation is on the mainnet.
   */
  isMainnet: boolean;
  /**
   * BTC account from which the assets will be distributed.
   */
  fromBtcAccount: string;
  /**
   * Public key of the BTC account.
   */
  fromBtcAccountPubkey: string;
  /**
   * Fee rate for the BTC transaction (optional, default is 30).
   */
  btcFeeRate?: number;
  /**
   * BTC assets API service.
   */
  btcService: BtcAssetsApi;
  /**
   * Function to filter the RGBPP args list.
   */
  filterRgbppArgslist: (argsList: string[]) => Promise<string[]>;
}

/**
 * Prepares an unsigned PSBT (Partially Signed Bitcoin Transaction) for distributing RGBPP assets.
 * This function is used to estimate transaction fees before finalizing the transaction.
 *
 * @param {PrepareDistributeUnsignedPsbtParams} params - Parameters required to generate the unsigned PSBT.
 * @param {RgbppBtcAddressReceiver[]} params.receivers - List of receivers for the RGBPP assets.
 * @param {CKBComponents.Script} params.xudtType - Type script for the XUDT type.
 * @param {Collector} params.collector - Collector instance used to gather cells for the transaction.
 * @param {DataSource} params.btcDataSource - Data source for BTC transactions.
 * @param {BTCTestnetType} [params.btcTestnetType] - Type of BTC testnet (optional).
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {string} params.fromBtcAccount - BTC account from which the assets will be distributed.
 * @param {string} [params.fromBtcAccountPubkey] - Public key of the BTC account.
 * @param {number} [params.btcFeeRate] - Fee rate for the BTC transaction (optional, default is 30).
 * @param {BtcAssetsApi} params.btcService - The BTC assets API service.
 * @param {(argsList: string[]) => Promise<string[]>} params.filterRgbppArgslist - A function to filter the RGBPP args list.
 * @returns {Promise<bitcoin.Psbt>} - Promise that resolves to the unsigned PSBT.
 */
export const prepareDistributeUnsignedPsbt = async ({
  receivers,
  xudtType,
  collector,
  btcDataSource,
  btcTestnetType,
  isMainnet,
  fromBtcAccount,
  fromBtcAccountPubkey,
  btcFeeRate = 30,
  btcService,
  filterRgbppArgslist,
}: PrepareDistributeUnsignedPsbtParams): Promise<bitcoin.Psbt> => {
  const lockArgsListResponse = await getRgbppLockArgsList({
    xudtType,
    fromBtcAccount,
    btcService,
  });
  const filteredLockArgsList = await filterRgbppArgslist(
    lockArgsListResponse.rgbppLockArgsList,
  );

  const ckbVirtualTxResult = await genBtcBatchTransferCkbVirtualTx({
    collector,
    rgbppLockArgsList: filteredLockArgsList,
    xudtTypeBytes: serializeScript(xudtType),
    rgbppReceivers: receivers,
    isMainnet,
    btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;

  // Generate unsigned PSBT
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: receivers.map((receiver) => receiver.toBtcAddress),
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: fromBtcAccount,
    fromPubkey: fromBtcAccountPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });

  return psbt;
};
