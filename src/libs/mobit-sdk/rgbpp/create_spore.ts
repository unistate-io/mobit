import * as ccc from "@ckb-ccc/core";
import {
  appendCkbTxWitnesses,
  BTCTestnetType,
  buildAppendingIssuerCellToSporesCreateTx,
  Collector,
  genCreateSporeCkbVirtualTx,
  generateSporeCreateCoBuild,
  Hex,
  RawSporeData,
  updateCkbTxWithRealBtcTxId,
} from "@rgbpp-sdk/ckb";
import { BtcAssetsApi, DataSource, sendRgbppUtxos } from "rgbpp";
import { AbstractWallet, TxResult } from "../helper";
import { signAndSendPsbt } from "../wallet";
import { bitcoin } from "@rgbpp-sdk/btc";
import { convertToTransaction } from "../convert";

interface SporeCreateParams {
  clusterRgbppLockArgs: Hex;
  receivers: {
    toBtcAddress: string;
    sporeData: RawSporeData;
  }[];
  collector: Collector;
  isMainnet: boolean;
  btcTestnetType?: BTCTestnetType;
  fromBtcAccount: string;
  fromBtcAccountPubkey: string;
  btcDataSource: DataSource;
  wallet: AbstractWallet;
  ckbAddress: string;
  btcService: BtcAssetsApi;
  cccSigner: ccc.Signer;
}

// Warning: Before running this file for the first time, please run 2-prepare-cluster.ts
const createSpores = async (
  {
    clusterRgbppLockArgs,
    receivers,
    collector,
    isMainnet,
    btcTestnetType,
    fromBtcAccount,
    fromBtcAccountPubkey,
    btcDataSource,
    wallet,
    btcService,
    ckbAddress,
    cccSigner,
  }: SporeCreateParams,
  btcFeeRate = 120,
  ckbFeeRate?: bigint,
): Promise<TxResult> => {
  const ckbVirtualTxResult = await genCreateSporeCkbVirtualTx({
    collector,
    sporeDataList: receivers.map((receiver) => receiver.sporeData),
    clusterRgbppLockArgs,
    isMainnet,
    ckbFeeRate: BigInt(2000),
    btcTestnetType,
  });

  const {
    commitment,
    ckbRawTx,
    sumInputsCapacity,
    clusterCell,
    needPaymasterCell,
  } = ckbVirtualTxResult;

  // Send BTC tx
  // The first btc address is the owner of the cluster cell and the rest btc addresses are spore receivers
  const btcTos = [
    fromBtcAccount,
    ...receivers.map((receiver) => receiver.toBtcAddress),
  ];
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: btcTos,
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: fromBtcAccount,
    fromPubkey: fromBtcAccountPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });

  const { txId: btcTxId, rawTxHex: btcTxBytes } = await signAndSendPsbt(
    psbt,
    wallet,
    btcService,
  );
  console.log("BTC TxId: ", btcTxId);

  await btcService.sendRgbppCkbTransaction({
    btc_txid: btcTxId,
    ckb_virtual_result: ckbVirtualTxResult,
  });

  const interval = setInterval(async () => {
    try {
      console.log("Waiting for BTC tx and proof to be ready");
      const rgbppApiSpvProof = await btcService.getRgbppSpvProof(btcTxId, 0);
      clearInterval(interval);
      // Update CKB transaction with the real BTC txId
      const newCkbRawTx = updateCkbTxWithRealBtcTxId({
        ckbRawTx,
        btcTxId,
        isMainnet,
      });
      console.log(
        "The new cluster rgbpp lock args: ",
        newCkbRawTx.outputs[0].lock.args,
      );

      const ckbTx = await appendCkbTxWitnesses({
        ckbRawTx: newCkbRawTx,
        btcTxBytes,
        rgbppApiSpvProof,
      });

      // The outputs[1..] are spore cells from which you can find spore type scripts,
      // and the spore type scripts will be used to transfer and leap spores
      console.log(
        "Spore type scripts: ",
        JSON.stringify(ckbTx.outputs.slice(1).map((output) => output.type)),
      );

      // Replace cobuild witness with the final rgbpp lock script
      ckbTx.witnesses[ckbTx.witnesses.length - 1] = generateSporeCreateCoBuild({
        // The first output is cluster cell and the rest of the outputs are spore cells
        sporeOutputs: ckbTx.outputs.slice(1),
        sporeOutputsData: ckbTx.outputsData.slice(1),
        clusterCell,
        clusterOutputCell: ckbTx.outputs[0],
      });

      // console.log('ckbTx: ', JSON.stringify(ckbTx));

      const unsignedTx = convertToTransaction(
        await buildAppendingIssuerCellToSporesCreateTx({
          issuerAddress: ckbAddress,
          ckbRawTx: ckbTx,
          collector,
          sumInputsCapacity,
          ckbFeeRate: BigInt(0),
          witnessLockPlaceholderSize: 0,
        }),
      );

      await unsignedTx.completeFeeBy(cccSigner, ckbFeeRate);

      const txHash = await cccSigner.sendTransaction(unsignedTx);

      console.info(`RGB++ Spore has been created and tx hash is ${txHash}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, 30 * 1000);

  return {
    btcTxId,
  };
};

/**
 * Parameters for creating spores combined with the given parameters.
 */
export interface SporeCreateCombinedParams {
  /**
   * The cluster type script.
   */
  clusterType: CKBComponents.Script;
  /**
   * The list of receivers with their BTC addresses and spore data.
   */
  receivers: {
    /**
     * The BTC address of the receiver.
     */
    toBtcAddress: string;
    /**
     * The raw spore data.
     */
    sporeData: RawSporeData;
  }[];
  /**
   * The collector instance.
   */
  collector: Collector;
  /**
   * Indicates if the operation is on mainnet.
   */
  isMainnet: boolean;
  /**
   * The type of BTC testnet (optional).
   */
  btcTestnetType?: BTCTestnetType;
  /**
   * The BTC account from which the spores are being created.
   */
  fromBtcAccount: string;
  /**
   * The public key of the BTC account.
   */
  fromBtcAccountPubkey: string;
  /**
   * The data source for BTC.
   */
  btcDataSource: DataSource;
  /**
   * Wallet instance used for signing BTC transactions.
   */
  wallet: AbstractWallet;
  /**
   * The CKB address.
   */
  ckbAddress: string;
  /**
   * The BTC assets API service.
   */
  btcService: BtcAssetsApi;
  /**
   * The CCC signer instance.
   */
  cccSigner: ccc.Signer;
}

/**
 * Creates spores combined with the given parameters.
 *
 * @param {SporeCreateCombinedParams} params - The parameters for creating spores.
 * @param {CKBComponents.Script} params.clusterType - The cluster type script.
 * @param {Array<{ toBtcAddress: string, sporeData: RawSporeData }>} params.receivers - The list of receivers with their BTC addresses and spore data.
 * @param {Collector} params.collector - The collector instance.
 * @param {boolean} params.isMainnet - Indicates if the operation is on mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - The type of BTC testnet (optional).
 * @param {string} params.fromBtcAccount - The BTC account from which the spores are being created.
 * @param {string} [params.fromBtcAccountPubkey] - The public key of the BTC account.
 * @param {DataSource} params.btcDataSource - The data source for BTC.
 * @param {AbstractWallet} params.wallet - Wallet instance used for signing BTC transactions.
 * @param {string} params.ckbAddress - The CKB address.
 * @param {BtcAssetsApi} params.btcService - The BTC assets API service.
 * @param {ccc.Signer} params.cccSigner - The CCC signer instance.
 * @param {number} [btcFeeRate=120] - The fee rate for BTC transactions (default is 120).
 * @returns {Promise<TxResult>} - The result of the transaction.
 */
export const createSporesCombined = async (
  {
    clusterType,
    receivers,
    collector,
    isMainnet,
    btcTestnetType,
    fromBtcAccount,
    fromBtcAccountPubkey,
    btcDataSource,
    wallet,
    btcService,
    ckbAddress,
    cccSigner,
  }: SporeCreateCombinedParams,
  btcFeeRate: number = 120,
  ckbFeeRate?: bigint,
): Promise<TxResult> => {
  const clusterRgbppLockArgs = await fetchAndValidateAssets(
    fromBtcAccount,
    clusterType,
    btcService,
  );

  const res = await createSpores(
    {
      clusterRgbppLockArgs,
      receivers,
      collector,
      isMainnet,
      btcTestnetType,
      fromBtcAccount,
      fromBtcAccountPubkey,
      btcDataSource,
      wallet,
      btcService,
      ckbAddress,
      cccSigner,
    },
    btcFeeRate,
    ckbFeeRate,
  );

  return res;
};

/**
 * Parameters for preparing an unsigned CKB transaction for creating spores.
 */
export interface PrepareCreateSporeUnsignedTransactionParams {
  /**
   * The arguments for the cluster RGBPP lock.
   * Note: This should be generated using the `fetchAndValidateAssets` function.
   * Example:
   * ```typescript
   * const clusterRgbppLockArgs = await fetchAndValidateAssets(
   *   fromBtcAccount,
   *   clusterTypeScriptArgs,
   *   isMainnet,
   *   btcService,
   * );
   * ```
   */
  clusterRgbppLockArgs: Hex;
  /**
   * The list of receivers with their BTC addresses and spore data.
   */
  receivers: {
    /**
     * The BTC address of the receiver.
     */
    toBtcAddress: string;
    /**
     * The raw spore data.
     */
    sporeData: RawSporeData;
  }[];
  /**
   * The collector instance.
   */
  collector: Collector;
  /**
   * Indicates if the operation is on mainnet.
   */
  isMainnet: boolean;
  /**
   * The type of BTC testnet (optional).
   */
  btcTestnetType?: BTCTestnetType;
  /**
   * The CKB address.
   */
  ckbAddress: string;
  /**
   * The fee rate for CKB transactions (optional).
   */
  ckbFeeRate?: bigint;
}

/**
 * Prepares an unsigned CKB transaction for creating spores.
 *
 * @param {PrepareCreateSporeUnsignedTransactionParams} params - The parameters for preparing the unsigned CKB transaction.
 * @param {Hex} params.clusterRgbppLockArgs - The arguments for the cluster RGBPP lock.
 * @param {Array<{ toBtcAddress: string, sporeData: RawSporeData }>} params.receivers - The list of receivers with their BTC addresses and spore data.
 * @param {Collector} params.collector - The collector instance.
 * @param {boolean} params.isMainnet - Indicates if the operation is on mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - The type of BTC testnet (optional).
 * @param {string} params.ckbAddress - The CKB address.
 * @param {bigint} [params.ckbFeeRate] - The fee rate for CKB transactions (optional).
 * @param {number} [params.witnessLockPlaceholderSize] - The size of the witness lock placeholder (optional). This parameter is used to estimate the transaction size when the witness lock placeholder size is known.
 * @returns {Promise<CKBComponents.RawTransactionToSign>} - The unsigned CKB transaction.
 * --------------------------------------------------------------------------------
 * Note: This example demonstrates how to fetch the corresponding parameters using the `fetchAndValidateAssets` function.
 * Example:
 * ```typescript
 * const clusterRgbppLockArgs = await fetchAndValidateAssets(
 *   fromBtcAccount,
 *   clusterTypeScriptArgs,
 *   isMainnet,
 *   btcService,
 * );
 * ```
 */
export const prepareCreateSporeUnsignedTransaction = async ({
  clusterRgbppLockArgs,
  receivers,
  collector,
  isMainnet,
  btcTestnetType,
  ckbAddress,
  ckbFeeRate,
}: PrepareCreateSporeUnsignedTransactionParams): Promise<
  CKBComponents.RawTransactionToSign
> => {
  const ckbVirtualTxResult = await genCreateSporeCkbVirtualTx({
    collector,
    sporeDataList: receivers.map((receiver) => receiver.sporeData),
    clusterRgbppLockArgs,
    isMainnet,
    ckbFeeRate: BigInt(2000),
    btcTestnetType,
  });

  const { ckbRawTx, sumInputsCapacity } = ckbVirtualTxResult;

  const unsignedTx = await buildAppendingIssuerCellToSporesCreateTx({
    issuerAddress: ckbAddress,
    ckbRawTx,
    collector,
    sumInputsCapacity,
    ckbFeeRate,
  });

  return unsignedTx;
};

/**
 * Parameters for preparing an unsigned BTC transaction for creating spores.
 */
export interface PrepareCreateSporeUnsignedPsbtParams {
  /**
   * The arguments for the cluster RGBPP lock.
   * Note: This should be generated using the `fetchAndValidateAssets` function.
   * Example:
   * ```typescript
   * const clusterRgbppLockArgs = await fetchAndValidateAssets(
   *   fromBtcAccount,
   *   clusterTypeScriptArgs,
   *   isMainnet,
   *   btcService,
   * );
   * ```
   */
  clusterRgbppLockArgs: Hex;
  /**
   * The list of receivers with their BTC addresses and spore data.
   */
  receivers: {
    /**
     * The BTC address of the receiver.
     */
    toBtcAddress: string;
    /**
     * The raw spore data.
     */
    sporeData: RawSporeData;
  }[];
  /**
   * The collector instance.
   */
  collector: Collector;
  /**
   * Indicates if the operation is on mainnet.
   */
  isMainnet: boolean;
  /**
   * The type of BTC testnet (optional).
   */
  btcTestnetType?: BTCTestnetType;
  /**
   * The BTC account from which the spores are being created.
   */
  fromBtcAccount: string;
  /**
   * The public key of the BTC account.
   */
  fromBtcAccountPubkey: string;
  /**
   * The data source for BTC.
   */
  btcDataSource: DataSource;
  /**
   * The fee rate for BTC transactions (optional).
   */
  btcFeeRate?: number;
}

/**
 * Prepares an unsigned BTC transaction for creating spores.
 *
 * @param {PrepareCreateSporeUnsignedPsbtParams} params - The parameters for preparing the unsigned BTC transaction.
 * @param {Hex} params.clusterRgbppLockArgs - The arguments for the cluster RGBPP lock.
 * @param {Array<{ toBtcAddress: string, sporeData: RawSporeData }>} params.receivers - The list of receivers with their BTC addresses and spore data.
 * @param {Collector} params.collector - The collector instance.
 * @param {boolean} params.isMainnet - Indicates if the operation is on mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - The type of BTC testnet (optional).
 * @param {string} params.fromBtcAccount - The BTC account from which the spores are being created.
 * @param {string} [params.fromBtcAccountPubkey] - The public key of the BTC account.
 * @param {DataSource} params.btcDataSource - The data source for BTC.
 * @param {number} [params.btcFeeRate] - The fee rate for BTC transactions (optional).
 * @returns {Promise<bitcoin.Psbt>} - The unsigned BTC transaction in PSBT format.
 *
 * --------------------------------------------------------------------------------
 * Note: This example demonstrates how to fetch the corresponding parameters using the `fetchAndValidateAssets` function.
 * Example:
 * ```typescript
 * const clusterRgbppLockArgs = await fetchAndValidateAssets(
 *   fromBtcAccount,
 *   clusterTypeScriptArgs,
 *   isMainnet,
 *   btcService,
 * );
 * ```
 */
export const prepareCreateSporeUnsignedPsbt = async ({
  clusterRgbppLockArgs,
  receivers,
  collector,
  isMainnet,
  btcTestnetType,
  fromBtcAccount,
  fromBtcAccountPubkey,
  btcDataSource,
  btcFeeRate,
}: PrepareCreateSporeUnsignedPsbtParams): Promise<bitcoin.Psbt> => {
  const ckbVirtualTxResult = await genCreateSporeCkbVirtualTx({
    collector,
    sporeDataList: receivers.map((receiver) => receiver.sporeData),
    clusterRgbppLockArgs,
    isMainnet,
    ckbFeeRate: BigInt(2000),
    btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;

  // The first btc address is the owner of the cluster cell and the rest btc addresses are spore receivers
  const btcTos = [
    fromBtcAccount,
    ...receivers.map((receiver) => receiver.toBtcAddress),
  ];

  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: btcTos,
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: fromBtcAccount,
    fromPubkey: fromBtcAccountPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });

  return psbt;
};

/**
 * Fetches RGBPP assets for a given BTC address and type script, and validates the result.
 *
 * @param {string} fromBtcAccount - The BTC account from which the assets are being fetched.
 * @param {CKBComponents.Script} clusterType - The cluster type script.
 * @param {BtcAssetsApi} btcService - The BTC assets API service.
 * @returns {Promise<string>} - The cluster RGBPP lock args.
 * @throws {Error} - Throws an error if no assets are found for the given BTC address and type script.
 */
export const fetchAndValidateAssets = async (
  fromBtcAccount: string,
  clusterType: CKBComponents.Script,
  btcService: BtcAssetsApi,
): Promise<string> => {
  const assets = await btcService.getRgbppAssetsByBtcAddress(fromBtcAccount, {
    type_script: encodeURIComponent(JSON.stringify(clusterType)),
  });

  if (assets.length === 0) {
    throw new Error(
      "No assets found for the given BTC address and type script.",
    );
  }

  return assets[0].cellOutput.lock.args;
};
