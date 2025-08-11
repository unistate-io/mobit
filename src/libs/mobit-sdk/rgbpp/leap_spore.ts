import {
  BTCTestnetType,
  Collector,
  genLeapSporeFromBtcToCkbVirtualTx,
  Hex,
  serializeScript,
} from "@rgbpp-sdk/ckb";
import { BtcAssetsApi, DataSource, sendRgbppUtxos } from "rgbpp";
import { AbstractWallet, TxResult } from "../helper";
import { signAndSendPsbt } from "../wallet";
import { getSporeRgbppLockArgs } from "./transfer_spore";
import { bitcoin } from "@rgbpp-sdk/btc";

interface SporeLeapParams {
  sporeRgbppLockArgs: Hex;
  toCkbAddress: string;
  sporeType: CKBComponents.Script;
  collector: Collector;
  isMainnet: boolean;
  btcTestnetType?: BTCTestnetType;
  fromBtcAddress: string;
  fromBtcAddressPubkey: string;
  btcDataSource: DataSource;
  wallet: AbstractWallet;
  btcService: BtcAssetsApi;
}

const leapSporeFromBtcToCkb = async (
  {
    sporeRgbppLockArgs,
    toCkbAddress,
    sporeType,
    collector,
    isMainnet,
    btcTestnetType,
    fromBtcAddress,
    fromBtcAddressPubkey,
    btcDataSource,
    wallet,
    btcService,
  }: SporeLeapParams,
  btcFeeRate: number = 30,
): Promise<TxResult> => {
  const sporeTypeBytes = serializeScript(sporeType);
  const ckbVirtualTxResult = await genLeapSporeFromBtcToCkbVirtualTx({
    collector,
    sporeRgbppLockArgs,
    sporeTypeBytes,
    toCkbAddress,
    isMainnet,
    btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;
  // Send BTC tx
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: [fromBtcAddress],
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: fromBtcAddress,
    fromPubkey: fromBtcAddressPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });
  const { txId: btcTxId } = await signAndSendPsbt(psbt, wallet, btcService);
  console.log("BTC TxId: ", btcTxId);
  await btcService.sendRgbppCkbTransaction({
    btc_txid: btcTxId,
    ckb_virtual_result: ckbVirtualTxResult,
  });
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
            `Rgbpp spore has been leaped from BTC to CKB and the related CKB tx hash is ${txHash}`,
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

  return {
    btcTxId,
  };
};

/**
 * Parameters required for the combined process of leaping a spore from BTC to CKB.
 */
export interface SporeLeapCombinedParams {
  /** The CKB address to which the spore will be sent. */
  toCkbAddress: string;
  /** The type script for the spore. */
  sporeType: CKBComponents.Script;
  /** The collector object used for collecting the spore. */
  collector: Collector;
  /** Indicates whether the operation is on the mainnet. */
  isMainnet: boolean;
  /** The type of BTC testnet (optional). */
  btcTestnetType?: BTCTestnetType;
  /** The BTC address from which the spore will be sent. */
  fromBtcAddress: string;
  /** The public key of the BTC address. */
  fromBtcAddressPubkey: string;
  /** The data source for BTC transactions. */
  btcDataSource: DataSource;
  /** Wallet instance used for signing BTC transactions. */
  wallet: AbstractWallet;
  /** The BTC assets API service. */
  btcService: BtcAssetsApi;
}

/**
 * Combines the process of leaping a spore from BTC to CKB with the necessary parameters.
 *
 * @param {SporeLeapCombinedParams} params - The parameters required for the spore leap process.
 * @param {number} [btcFeeRate=30] - The fee rate for the BTC transaction (default is 30).
 *
 * @param {string} params.toCkbAddress - The CKB address to which the spore will be sent.
 * @param {CKBComponents.Script} params.sporeType - The type script for the spore.
 * @param {Collector} params.collector - The collector object used for collecting the spore.
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - The type of BTC testnet (optional).
 * @param {string} params.fromBtcAddress - The BTC address from which the spore will be sent.
 * @param {string} [params.fromBtcAddressPubkey] - The public key of the BTC address.
 * @param {DataSource} params.btcDataSource - The data source for BTC transactions.
 * @param {AbstractWallet} params.wallet - Wallet instance used for signing BTC transactions.
 * @param {BtcAssetsApi} params.btcService - The BTC assets API service.
 *
 * @returns {Promise<TxResult>} - The result of the transaction, including the BTC transaction ID.
 */
export const leapSporeFromBtcToCkbCombined = async (
  {
    toCkbAddress,
    sporeType,
    collector,
    isMainnet,
    btcTestnetType,
    fromBtcAddress,
    fromBtcAddressPubkey,
    btcDataSource,
    wallet,
    btcService,
  }: SporeLeapCombinedParams,
  btcFeeRate: number = 30,
): Promise<TxResult> => {
  const sporeRgbppLockArgs = await getSporeRgbppLockArgs({
    fromBtcAddress,
    sporeType,
    isMainnet,
    btcService,
  });

  const res = await leapSporeFromBtcToCkb(
    {
      sporeRgbppLockArgs,
      toCkbAddress,
      sporeType,
      collector,
      isMainnet,
      btcTestnetType,
      fromBtcAddress,
      fromBtcAddressPubkey,
      btcDataSource,
      wallet,
      btcService,
    },
    btcFeeRate,
  );

  return res;
};
/**
 * Parameters required to generate an unsigned PSBT (Partially Signed Bitcoin Transaction) for leaping a spore from Bitcoin to CKB.
 * This interface is used to estimate transaction fees before finalizing the transaction.
 */
export interface PrepareLeapSporeUnsignedPsbtParams {
  /** The destination CKB address. */
  toCkbAddress: string;
  /** Type script for the spore. */
  sporeType: CKBComponents.Script;
  /** Collector instance used to gather cells for the transaction. */
  collector: Collector;
  /** Indicates whether the operation is on the mainnet. */
  isMainnet: boolean;
  /** Type of BTC testnet (optional). */
  btcTestnetType?: BTCTestnetType;
  /** BTC address from which the spore will be leaped. */
  fromBtcAddress: string;
  /** Public key of the BTC address. */
  fromBtcAddressPubkey: string;
  /** Data source for BTC transactions. */
  btcDataSource: DataSource;
  /** Fee rate for the BTC transaction (optional, default is 30). */
  btcFeeRate?: number;
  /** The BTC assets API service. */
  btcService: BtcAssetsApi;
}

/**
 * Prepares an unsigned PSBT (Partially Signed Bitcoin Transaction) for leaping a spore from Bitcoin to CKB.
 * This function is used to estimate transaction fees before finalizing the transaction.
 *
 * @param {PrepareLeapSporeUnsignedPsbtParams} params - Parameters required to generate the unsigned PSBT.
 * @param {Hex} params.sporeRgbppLockArgs - RGBPP lock arguments for the spore.
 * @param {string} params.toCkbAddress - The destination CKB address.
 * @param {CKBComponents.Script} params.sporeType - Type script for the spore.
 * @param {Collector} params.collector - Collector instance used to gather cells for the transaction.
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - Type of BTC testnet (optional).
 * @param {string} params.fromBtcAddress - BTC address from which the spore will be leaped.
 * @param {string} [params.fromBtcAddressPubkey] - Public key of the BTC address.
 * @param {DataSource} params.btcDataSource - Data source for BTC transactions.
 * @param {number} [params.btcFeeRate] - Fee rate for the BTC transaction (optional, default is 30).
 * @param {BtcAssetsApi} params.btcService - The BTC assets API service.
 * @returns {Promise<bitcoin.Psbt>} - Promise that resolves to the unsigned PSBT.
 */
export const prepareLeapSporeUnsignedPsbt = async ({
  toCkbAddress,
  sporeType,
  collector,
  isMainnet,
  btcTestnetType,
  fromBtcAddress,
  fromBtcAddressPubkey,
  btcDataSource,
  btcFeeRate = 30,
  btcService,
}: PrepareLeapSporeUnsignedPsbtParams): Promise<bitcoin.Psbt> => {
  const sporeRgbppLockArgs = await getSporeRgbppLockArgs({
    fromBtcAddress,
    sporeType,
    isMainnet,
    btcService,
  });

  const sporeTypeBytes = serializeScript(sporeType);

  const ckbVirtualTxResult = await genLeapSporeFromBtcToCkbVirtualTx({
    collector,
    sporeRgbppLockArgs,
    sporeTypeBytes,
    toCkbAddress,
    isMainnet,
    btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;

  // Generate unsigned PSBT
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: [fromBtcAddress],
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: fromBtcAddress,
    fromPubkey: fromBtcAddressPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });

  return psbt;
};
