import {
  BTCTestnetType,
  Collector,
  genTransferSporeCkbVirtualTx,
  getSporeTypeScript,
  Hex,
  serializeScript,
} from "@rgbpp-sdk/ckb";
import { BtcAssetsApi, DataSource, sendRgbppUtxos } from "rgbpp";
import { AbstractWallet } from "../helper";
import { signAndSendPsbt } from "../wallet";
import { bitcoin } from "@rgbpp-sdk/btc";

interface SporeTransferParams {
  sporeRgbppLockArgs: Hex;
  toBtcAddress: string;
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

const transferSpore = async (
  {
    sporeRgbppLockArgs,
    toBtcAddress,
    sporeType,
    collector,
    isMainnet,
    btcTestnetType,
    fromBtcAddress,
    fromBtcAddressPubkey,
    btcDataSource,
    btcService,
    wallet,
  }: SporeTransferParams,
  btcFeeRate: number = 30,
) => {
  const sporeTypeBytes = serializeScript(sporeType);

  const ckbVirtualTxResult = await genTransferSporeCkbVirtualTx({
    collector,
    sporeRgbppLockArgs,
    sporeTypeBytes,
    isMainnet,
    btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;

  // Send BTC tx
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: [toBtcAddress],
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
            `Rgbpp spore has been transferred on BTC and the related CKB tx hash is ${txHash}`,
          );
        } else {
          console.warn(
            `Rgbpp CKB transaction failed and the reason is ${failedReason} `,
          );
        }
      }
    }, 30 * 1000);
  } catch (error) {
    let processedError: Error;
    if (error instanceof Error) {
      processedError = error;
    } else {
      processedError = new Error(String(error));
    }
    console.error(processedError);
    return {
      error: processedError,
      btcTxId,
    };
  }

  return {
    btcTxId,
  };
};

/**
 * Interface for parameters required to transfer a spore combined.
 */
export interface SporeTransferCombinedParams {
  /** The recipient's BTC address. */
  toBtcAddress: string;
  /** Type script for the spore. */
  sporeType: CKBComponents.Script;
  /** Collector instance used to gather cells for the transaction. */
  collector: Collector;
  /** Indicates whether the operation is on the mainnet. */
  isMainnet: boolean;
  /** Type of BTC testnet (optional). */
  btcTestnetType?: BTCTestnetType;
  /** BTC address from which the spore will be transferred. */
  fromBtcAddress: string;
  /** Public key of the BTC address. */
  fromBtcAddressPubkey: string;
  /** Data source for BTC transactions. */
  btcDataSource: DataSource;
  /** Wallet instance used for signing BTC transactions. */
  wallet: AbstractWallet;
  /** The BTC assets API service. */
  btcService: BtcAssetsApi;
}

/**
 * Transfers a spore to a specified BTC address.
 *
 * @param {SporeTransferCombinedParams} params - The parameters for the spore transfer.
 * @param {string} params.toBtcAddress - The recipient's BTC address.
 * @param {CKBComponents.Script} params.sporeType - The type script for the spore.
 * @param {Collector} params.collector - The collector object.
 * @param {boolean} params.isMainnet - Indicates if the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - The type of BTC testnet (optional).
 * @param {string} params.fromBtcAddress - The sender's BTC address.
 * @param {string} [params.fromBtcAddressPubkey] - The sender's BTC address public key.
 * @param {DataSource} params.btcDataSource - The data source for BTC.
 * @param {AbstractWallet} params.wallet - Wallet instance used for signing BTC transactions.
 * @param {BtcAssetsApi} params.btcService - The BTC assets API service.
 * @param {number} [btcFeeRate=30] - The fee rate for the BTC transaction (optional, default is 30).
 * @returns {Promise<{ btcTxId: string }>} - The result of the spore transfer, including the BTC transaction ID.
 */
export const transferSporeCombined = async (
  {
    toBtcAddress,
    sporeType,
    collector,
    isMainnet,
    btcTestnetType,
    fromBtcAddress,
    fromBtcAddressPubkey,
    btcDataSource,
    wallet,
    btcService,
  }: SporeTransferCombinedParams,
  btcFeeRate: number = 30,
): Promise<{ btcTxId: string }> => {
  const sporeRgbppLockArgs = await getSporeRgbppLockArgs({
    fromBtcAddress,
    sporeType,
    isMainnet,
    btcService,
  });

  const res = await transferSpore(
    {
      sporeRgbppLockArgs,
      toBtcAddress,
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
 * Interface for parameters required to get spore RGBPP lock arguments.
 */
export interface GetSporeRgbppLockArgsParams {
  /** The BTC address from which the spore will be transferred. */
  fromBtcAddress: string;
  /** Type script for the spore. */
  sporeType: CKBComponents.Script;
  /** Indicates whether the operation is on the mainnet. */
  isMainnet: boolean;
  /** The BTC assets API service. */
  btcService: BtcAssetsApi;
}

/**
 * Retrieves the spore RGBPP lock arguments based on the provided parameters.
 * @param {GetSporeRgbppLockArgsParams} params - The parameters for retrieving the spore RGBPP lock arguments.
 * @param {string} params.fromBtcAddress - The BTC address from which the spore will be transferred.
 * @param {CKBComponents.Script} params.sporeType - Type script for the spore.
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {BtcAssetsApi} params.btcService - The BTC assets API service.
 * @returns {Promise<Hex>} - A promise that resolves to the spore RGBPP lock arguments.
 */
export const getSporeRgbppLockArgs = async ({
  fromBtcAddress,
  sporeType,
  isMainnet,
  btcService,
}: GetSporeRgbppLockArgsParams): Promise<Hex> => {
  const type_script = JSON.stringify(sporeType);

  console.log(type_script);

  try {
    const data = await btcService.getRgbppAssetsByBtcAddress(fromBtcAddress, {
      type_script: encodeURIComponent(type_script),
      no_cache: false,
    });

    console.log(data);

    if (data.length === 0) {
      throw new Error(
        "No assets found for the given BTC address and type script.",
      );
    }
    // Assuming you want to return the sporeRgbppLockArgs based on the response
    const sporeRgbppLockArgs = data.map((asset) => asset.cellOutput.lock.args);

    // Assuming you need to return a single Hex value from the list
    return sporeRgbppLockArgs[0];
  } catch (error) {
    console.error("Error fetching sporeRgbppLockArgs:", error);
    throw error;
  }
};

/**
 * Interface for parameters required to prepare an unsigned PSBT for transferring a spore.
 */
export interface PrepareTransferSporeUnsignedPsbtParams {
  /** The recipient's BTC address. */
  toBtcAddress: string;
  /** Type script for the spore. */
  sporeType: CKBComponents.Script;
  /** Collector instance used to gather cells for the transaction. */
  collector: Collector;
  /** Indicates whether the operation is on the mainnet. */
  isMainnet: boolean;
  /** Type of BTC testnet (optional). */
  btcTestnetType?: BTCTestnetType;
  /** BTC address from which the spore will be transferred. */
  fromBtcAddress: string;
  /** Public key of the BTC address. */
  fromBtcAddressPubkey: string;
  /** The BTC assets API service. */
  btcService: BtcAssetsApi;
  /** Data source for BTC transactions. */
  btcDataSource: DataSource;
  /** Fee rate for the BTC transaction (optional, default is 30). */
  btcFeeRate?: number;
}

/**
 * Prepares an unsigned PSBT (Partially Signed Bitcoin Transaction) for transferring a spore.
 * This function is used to estimate transaction fees before finalizing the transaction.
 *
 * @param {PrepareTransferSporeUnsignedPsbtParams} params - Parameters required to generate the unsigned PSBT.
 * @param {string} params.toBtcAddress - The recipient's BTC address.
 * @param {CKBComponents.Script} params.sporeType - Type script for the spore.
 * @param {Collector} params.collector - Collector instance used to gather cells for the transaction.
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - Type of BTC testnet (optional).
 * @param {string} params.fromBtcAddress - BTC address from which the spore will be transferred.
 * @param {string} [params.fromBtcAddressPubkey] - Public key of the BTC address.
 * @param {DataSource} params.btcDataSource - Data source for BTC transactions.
 * @param {number} [params.btcFeeRate] - Fee rate for the BTC transaction (optional, default is 30).
 * @param {BtcAssetsApi} params.btcService - The BTC assets API service.
 * @returns {Promise<bitcoin.Psbt>} - Promise that resolves to the unsigned PSBT.
 */
export const prepareTransferSporeUnsignedPsbt = async ({
  toBtcAddress,
  sporeType,
  collector,
  isMainnet,
  btcTestnetType,
  fromBtcAddress,
  fromBtcAddressPubkey,
  btcDataSource,
  btcService,
  btcFeeRate = 30,
}: PrepareTransferSporeUnsignedPsbtParams): Promise<bitcoin.Psbt> => {
  const sporeRgbppLockArgs = await getSporeRgbppLockArgs({
    fromBtcAddress,
    sporeType,
    isMainnet,
    btcService,
  });

  const sporeTypeBytes = serializeScript(sporeType);

  const ckbVirtualTxResult = await genTransferSporeCkbVirtualTx({
    collector,
    sporeRgbppLockArgs,
    sporeTypeBytes,
    isMainnet,
    btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;

  // Generate unsigned PSBT
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: [toBtcAddress],
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: fromBtcAddress,
    fromPubkey: fromBtcAddressPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });

  return psbt;
};
