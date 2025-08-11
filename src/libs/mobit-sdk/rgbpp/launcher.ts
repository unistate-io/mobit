import * as ccc from "@ckb-ccc/core";
import { addressToScript } from "@nervosnetwork/ckb-sdk-utils";
import { bitcoin, DataSource, sendRgbppUtxos } from "@rgbpp-sdk/btc";
import {
  append0x,
  appendCkbTxWitnesses,
  BTCTestnetType,
  buildRgbppLockArgs,
  calculateRgbppCellCapacity,
  calculateRgbppTokenInfoCellCapacity,
  Collector,
  genRgbppLaunchCkbVirtualTx,
  genRgbppLockScript,
  NoLiveCellError,
  RgbppTokenInfo,
  sendCkbTx,
  updateCkbTxWithRealBtcTxId,
} from "@rgbpp-sdk/ckb";
import { BtcApiUtxo } from "@rgbpp-sdk/service";
import { BtcAssetsApi } from "rgbpp";
import { AbstractWallet, TxResult } from "../helper";
import { signAndSendPsbt } from "../wallet";
import { convertToTransaction } from "../convert";

interface RgbppPrepareLauncerParams {
  outIndex: number;
  btcTxId: string;
  rgbppTokenInfo: RgbppTokenInfo;
  ckbAddress: string;
  collector: Collector;
  isMainnet: boolean;
  btcTestnetType?: BTCTestnetType;
}

const prepareLaunchCell = async ({
  outIndex,
  btcTxId,
  rgbppTokenInfo,
  ckbAddress,
  collector,
  isMainnet,
  btcTestnetType,
}: RgbppPrepareLauncerParams): Promise<CKBComponents.RawTransactionToSign> => {
  const masterLock = addressToScript(ckbAddress);
  console.log("ckb address: ", ckbAddress);

  // The capacity required to launch cells is determined by the token info cell capacity, and transaction fee.
  const launchCellCapacity = calculateRgbppCellCapacity() +
    calculateRgbppTokenInfoCellCapacity(rgbppTokenInfo, isMainnet);

  let emptyCells = await collector.getCells({
    lock: masterLock,
  });
  if (!emptyCells || emptyCells.length === 0) {
    throw new NoLiveCellError("The address has no empty cells");
  }
  emptyCells = emptyCells.filter((cell) => !cell.output.type);

  const { inputs } = collector.collectInputs(
    emptyCells,
    launchCellCapacity,
    BigInt(0),
  );

  const outputs: CKBComponents.CellOutput[] = [
    {
      lock: genRgbppLockScript(
        buildRgbppLockArgs(outIndex, btcTxId),
        isMainnet,
        btcTestnetType,
      ),
      capacity: append0x(launchCellCapacity.toString(16)),
    },
  ];

  const outputsData = ["0x", "0x"];

  const unsignedTx = {
    version: "0x0",
    cellDeps: [],
    headerDeps: [],
    inputs,
    outputs,
    outputsData,
    witnesses: [],
  };

  return unsignedTx;
};

interface RgbppLauncerParams {
  rgbppTokenInfo: RgbppTokenInfo;
  collector: Collector;
  isMainnet: boolean;
  btcTestnetType?: BTCTestnetType;
  btcAccount: string;
  btcAccountPubkey: string;
  btcDataSource: DataSource;
  launchAmount: bigint;
  btcService: BtcAssetsApi;
  ownerRgbppLockArgs: string;
  wallet: AbstractWallet;
}

const launchRgbppAsset = async (
  {
    ownerRgbppLockArgs,
    rgbppTokenInfo,
    collector,
    isMainnet,
    btcTestnetType,
    btcAccount,
    btcDataSource,
    btcAccountPubkey,
    launchAmount,
    btcService,
    wallet,
  }: RgbppLauncerParams,
  btcFeeRate?: number,
): Promise<TxResult> => {
  const ckbVirtualTxResult = await genRgbppLaunchCkbVirtualTx({
    collector: collector,
    ownerRgbppLockArgs,
    rgbppTokenInfo,
    launchAmount,
    isMainnet: isMainnet,
    btcTestnetType: btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;

  console.log("RGB++ Asset type script args: ", ckbRawTx.outputs[0].type?.args);

  // Send BTC tx
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: [btcAccount],
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: btcAccount,
    fromPubkey: btcAccountPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });

  const { txId: btcTxId, rawTxHex: btcTxBytes } = await signAndSendPsbt(
    psbt,
    wallet,
    btcService,
  );

  console.log(`BTC ${btcTestnetType} TxId: ${btcTxId}`);

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
      const ckbTx = await appendCkbTxWitnesses({
        ckbRawTx: newCkbRawTx,
        btcTxBytes,
        rgbppApiSpvProof,
      });

      const txHash = await sendCkbTx({ collector, signedTx: ckbTx });
      console.info(
        `RGB++ Asset has been launched and CKB tx hash is ${txHash}`,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, 30 * 1000);

  return { btcTxId };
};

/**
 * Parameters required for launching an RGB++ asset combined with CKB transaction preparation.
 */
export interface RgbppLauncerCombinedParams {
  /** Information about the RGB++ token to be launched. */
  rgbppTokenInfo: RgbppTokenInfo;
  /** Collector instance used to gather cells for the transaction. */
  collector: Collector;
  /** Indicates whether the operation is on the mainnet. */
  isMainnet: boolean;
  /** (Optional) Type of BTC testnet to use. */
  btcTestnetType?: BTCTestnetType;
  /** BTC account address. */
  btcAccount: string;
  /** Public key of the BTC account. */
  btcAccountPubkey: string;
  /** Data source for BTC transactions. */
  btcDataSource: DataSource;
  /** Amount of the asset to be launched, represented as a bigint. */
  launchAmount: bigint;
  /** Service instance for interacting with BTC assets. */
  btcService: BtcAssetsApi;
  /** CKB address where the asset will be launched. */
  ckbAddress: string;
  /** Signer instance for CKB transactions. */
  cccSigner: ccc.Signer;
  /** Function to filter UTXOs for the BTC transaction. */
  filterUtxo: (
    utxos: BtcApiUtxo[],
  ) => Promise<{ outIndex: number; btcTxId: string }>;
  /** Wallet instance used for signing BTC transactions. */
  wallet: AbstractWallet;
}

/**
 * Launches an RGB++ asset by preparing a launch cell and subsequently sending a BTC transaction.
 *
 * @param params - An object containing the necessary parameters for launching the RGB++ asset.
 * @param {RgbppTokenInfo} params.rgbppTokenInfo - Information about the RGB++ token to be launched.
 * @param {Collector} params.collector - The collector instance used to gather cells.
 * @param {boolean} params.isMainnet - A boolean indicating whether the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - (Optional) The type of BTC testnet to use.
 * @param {string} params.btcAccount - The BTC account address.
 * @param {string} [params.btcAccountPubkey] - The public key of the BTC account.
 * @param {DataSource} params.btcDataSource - The data source for BTC transactions.
 * @param {bigint} params.launchAmount - The amount of the asset to be launched, represented as a bigint.
 * @param {BtcAssetsApi} params.btcService - The service instance for interacting with BTC assets.
 * @param {string} params.ckbAddress - The CKB address where the asset will be launched.
 * @param {ccc.Signer} params.cccSigner - The signer instance for CKB transactions.
 * @param {(utxos: BtcApiUtxo[]) => Promise<{ outIndex: number; btcTxId: string }>} params.filterUtxo - A function to filter UTXOs for the BTC transaction.
 * @param {AbstractWallet} params.wallet - Wallet instance used for signing BTC transactions.
 * @param {bigint} [ckbFeeRate] - (Optional) The fee rate for CKB transactions, represented as a bigint.
 * @param {number} [btcFeeRate] - (Optional) The fee rate for BTC transactions, represented as a number.
 *
 * @returns A promise that resolves to the transaction result, including the BTC transaction ID and CKB transaction hash.
 */
export const launchCombined = async (
  {
    rgbppTokenInfo,
    collector,
    isMainnet,
    btcTestnetType,
    btcAccount,
    btcDataSource,
    btcAccountPubkey,
    launchAmount,
    ckbAddress,
    filterUtxo,
    btcService,
    wallet,
    cccSigner,
  }: RgbppLauncerCombinedParams,
  ckbFeeRate?: bigint,
  btcFeeRate?: number,
): Promise<TxResult> => {
  const { outIndex, btcTxId } = await fetchAndFilterUtxos(
    btcAccount,
    filterUtxo,
    btcService,
  );

  const prepareLaunchCellTx = convertToTransaction(
    await prepareLaunchCell({
      outIndex,
      btcTxId,
      rgbppTokenInfo,
      ckbAddress,
      collector,
      isMainnet,
      btcTestnetType,
    }),
  );
  await prepareLaunchCellTx.completeFeeBy(cccSigner, ckbFeeRate);

  const txHash = await cccSigner.sendTransaction(prepareLaunchCellTx);

  console.info(`Launch cell has been created and the CKB tx hash ${txHash}`);

  const ownerRgbppLockArgs = buildRgbppLockArgs(outIndex, btcTxId);

  const { btcTxId: TxId } = await launchRgbppAsset(
    {
      ownerRgbppLockArgs,
      rgbppTokenInfo,
      collector,
      isMainnet,
      btcAccount,
      btcDataSource,
      btcAccountPubkey,
      btcTestnetType,
      launchAmount,
      btcService,
      wallet,
    },
    btcFeeRate,
  );

  return {
    btcTxId: TxId,
    ckbTxHash: txHash,
  };
};
/**
 * Parameters required for preparing a launch cell transaction on the CKB network.
 */
export interface PrepareLaunchCellTransactionParams {
  /** CKB address where the launch cell will be created. */
  ckbAddress: string;
  /** Information about the RGB++ token to be launched. */
  rgbppTokenInfo: RgbppTokenInfo;
  /** Collector instance used to gather cells for the transaction. */
  collector: Collector;
  /** Indicates whether the operation is on the mainnet. */
  isMainnet: boolean;
  /** Type of BTC testnet (optional). */
  btcTestnetType?: BTCTestnetType;
  /** Output index of the BTC transaction. */
  outIndex: number;
  /** ID of the BTC transaction. */
  btcTxId: string;
}

/**
 * Prepares a launch cell on the CKB network by creating a transaction.
 *
 * @param {PrepareLaunchCellTransactionParams} params - Parameters required to prepare the launch cell.
 * @param {string} params.ckbAddress - CKB address where the launch cell will be created.
 * @param {RgbppTokenInfo} params.rgbppTokenInfo - Information about the RGB++ token to be launched.
 * @param {Collector} params.collector - Collector instance used to gather cells for the transaction.
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - Type of BTC testnet (optional).
 * @param {number} params.outIndex - Output index of the BTC transaction.
 * @param {string} params.btcTxId - ID of the BTC transaction.
 * @returns {Promise<CKBComponents.RawTransactionToSign>} - Promise that resolves to the prepared CKB transaction.
 *
 * --------------------------------------------
 * **Note: Example of fetching and filtering UTXOs:**
 * ```typescript
 * const { outIndex, btcTxId } = await fetchAndFilterUtxos(
 *   btcAccount,
 *   filterUtxo,
 *   btcService,
 * );
 * ```
 * This example demonstrates how to obtain the necessary parameters (`outIndex` and `btcTxId`) by fetching and filtering UTXOs.
 */
export const prepareLaunchCellTransaction = async ({
  ckbAddress,
  rgbppTokenInfo,
  collector,
  isMainnet,
  btcTestnetType,
  outIndex,
  btcTxId,
}: PrepareLaunchCellTransactionParams): Promise<
  CKBComponents.RawTransactionToSign
> => {
  const prepareLaunchCellTx = await prepareLaunchCell({
    outIndex,
    btcTxId,
    rgbppTokenInfo,
    ckbAddress,
    collector,
    isMainnet,
    btcTestnetType,
  });

  return prepareLaunchCellTx;
};

/**
 * Parameters required for generating an unsigned PSBT for launching an RGB++ asset.
 */
export interface PrepareLauncherUnsignedPsbtParams {
  /** Information about the RGB++ token to be launched. */
  rgbppTokenInfo: RgbppTokenInfo;
  /** Instance used to collect cells for the transaction. */
  collector: Collector;
  /** Indicates if the operation is on the mainnet. */
  isMainnet: boolean;
  /** (Optional) Type of BTC testnet to use. */
  btcTestnetType?: BTCTestnetType;
  /** Address of the BTC account. */
  btcAccount: string;
  /** Public key of the BTC account. */
  btcAccountPubkey: string;
  /** Source for BTC transaction data. */
  btcDataSource: DataSource;
  /** Amount of the asset to be launched, as a bigint. */
  launchAmount: bigint;
  /** Output index of the BTC transaction. */
  outIndex: number;
  /** ID of the BTC transaction. */
  btcTxId: string;
}

/**
 * Generates an unsigned PSBT for launching an RGB++ asset.
 *
 * @param {PrepareLauncherUnsignedPsbtParams} params - Parameters required for generating the unsigned PSBT.
 * @param {RgbppTokenInfo} params.rgbppTokenInfo - Details about the RGB++ token to be launched.
 * @param {Collector} params.collector - Instance used to collect cells for the transaction.
 * @param {boolean} params.isMainnet - Indicates if the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - (Optional) Type of BTC testnet to use.
 * @param {string} params.btcAccount - Address of the BTC account.
 * @param {string} [params.btcAccountPubkey] - Public key of the BTC account.
 * @param {DataSource} params.btcDataSource - Source for BTC transaction data.
 * @param {bigint} params.launchAmount - Amount of the asset to be launched, as a bigint.
 * @param {number} params.outIndex - Output index of the BTC transaction.
 * @param {string} params.btcTxId - ID of the BTC transaction.
 * @param {number} [btcFeeRate] - (Optional) Fee rate for BTC transactions, as a number.
 *
 * @returns {Promise<bitcoin.Psbt>} A promise resolving to the unsigned PSBT.
 *
 * --------------------------------------------
 * **Note: Example of fetching and filtering UTXOs:**
 * ```typescript
 * const { outIndex, btcTxId } = await fetchAndFilterUtxos(
 *   btcAccount,
 *   filterUtxo,
 *   btcService,
 * );
 * ```
 * This example demonstrates how to obtain the necessary parameters (`outIndex` and `btcTxId`) by fetching and filtering UTXOs.
 */
export const prepareLauncherUnsignedPsbt = async (
  {
    rgbppTokenInfo,
    collector,
    isMainnet,
    btcTestnetType,
    btcAccount,
    btcDataSource,
    btcAccountPubkey,
    launchAmount,
    outIndex,
    btcTxId,
  }: PrepareLauncherUnsignedPsbtParams,
  btcFeeRate?: number,
): Promise<bitcoin.Psbt> => {
  const ownerRgbppLockArgs = buildRgbppLockArgs(outIndex, btcTxId);

  const ckbVirtualTxResult = await genRgbppLaunchCkbVirtualTx({
    collector: collector,
    ownerRgbppLockArgs,
    rgbppTokenInfo,
    launchAmount,
    isMainnet: isMainnet,
    btcTestnetType: btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;

  console.log("RGB++ Asset type script args: ", ckbRawTx.outputs[0].type?.args);

  // Generate unsigned PSBT
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: [btcAccount],
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: btcAccount,
    fromPubkey: btcAccountPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });

  return psbt;
};

/**
 * Fetches the necessary UTXOs and filters them to get the output index and BTC transaction ID.
 *
 * @param {string} btcAccount - The BTC account address.
 * @param {Function} filterUtxo - The function used to filter UTXOs.
 * @param {BtcAssetsApi} btcService - The service instance for interacting with BTC assets.
 * @returns {Promise<{ outIndex: number, btcTxId: string }>} - A promise that resolves to an object containing the output index and BTC transaction ID.
 */
export const fetchAndFilterUtxos = async (
  btcAccount: string,
  filterUtxo: (
    utxos: BtcApiUtxo[],
  ) => Promise<{ outIndex: number; btcTxId: string }>,
  btcService: BtcAssetsApi,
): Promise<{ outIndex: number; btcTxId: string }> => {
  const utxos = await btcService.getBtcUtxos(btcAccount, {
    only_non_rgbpp_utxos: true,
    only_confirmed: true,
    min_satoshi: 10000,
  });

  const { outIndex, btcTxId } = await filterUtxo(utxos);
  return { outIndex, btcTxId };
};
