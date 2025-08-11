import * as ccc from "@ckb-ccc/core";
import { addressToScript } from "@nervosnetwork/ckb-sdk-utils";
import {
  append0x,
  appendCkbTxWitnesses,
  BTCTestnetType,
  buildRgbppLockArgs,
  calculateRgbppClusterCellCapacity,
  Collector,
  genCreateClusterCkbVirtualTx,
  generateClusterCreateCoBuild,
  genRgbppLockScript,
  NoLiveCellError,
  RawClusterData,
  sendCkbTx,
  updateCkbTxWithRealBtcTxId,
} from "@rgbpp-sdk/ckb";
import { BtcApiUtxo } from "@rgbpp-sdk/service";
import { BtcAssetsApi, DataSource, sendRgbppUtxos } from "rgbpp";
import { AbstractWallet, TxResult } from "../helper";
import { signAndSendPsbt } from "../wallet";
import { bitcoin } from "@rgbpp-sdk/btc";
import { fetchAndFilterUtxos } from "./launcher";
import { convertToTransaction } from "../convert";

interface prepareClusterCellParams {
  outIndex: number;
  btcTxId: string;
  ckbAddress: string;
  clusterData: RawClusterData;
  collector: Collector;
  isMainnet: boolean;
  btcTestnetType?: BTCTestnetType;
}

const prepareClusterCell = async ({
  outIndex,
  btcTxId,
  ckbAddress,
  clusterData,
  collector,
  isMainnet,
  btcTestnetType,
}: prepareClusterCellParams): Promise<CKBComponents.RawTransactionToSign> => {
  const masterLock = addressToScript(ckbAddress);
  console.log("ckb address: ", ckbAddress);

  // The capacity required to launch cells is determined by the token info cell capacity, and transaction fee.
  const clusterCellCapacity = calculateRgbppClusterCellCapacity(clusterData);

  let emptyCells = await collector.getCells({
    lock: masterLock,
  });
  if (!emptyCells || emptyCells.length === 0) {
    throw new NoLiveCellError("The address has no empty cells");
  }
  emptyCells = emptyCells.filter((cell) => !cell.output.type);

  const { inputs } = collector.collectInputs(
    emptyCells,
    clusterCellCapacity,
    BigInt(0),
  );

  const outputs: CKBComponents.CellOutput[] = [
    {
      lock: genRgbppLockScript(
        buildRgbppLockArgs(outIndex, btcTxId),
        isMainnet,
        btcTestnetType,
      ),
      capacity: append0x(clusterCellCapacity.toString(16)),
    },
  ];
  const outputsData = ["0x"];

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

interface createClusterParams {
  ownerRgbppLockArgs: string;
  collector: Collector;
  clusterData: RawClusterData;
  isMainnet: boolean;
  btcTestnetType?: BTCTestnetType;
  fromBtcAccount: string;
  fromBtcAccountPubkey: string;
  btcDataSource: DataSource;
  wallet: AbstractWallet;
  btcService: BtcAssetsApi;
}

const createCluster = async (
  {
    ownerRgbppLockArgs,
    collector,
    clusterData,
    isMainnet,
    btcTestnetType,
    fromBtcAccount,
    fromBtcAccountPubkey,
    btcDataSource,
    btcService,
    wallet,
  }: createClusterParams,
  btcFeeRate: number = 30,
): Promise<TxResult> => {
  const ckbVirtualTxResult = await genCreateClusterCkbVirtualTx({
    collector,
    rgbppLockArgs: ownerRgbppLockArgs,
    clusterData,
    isMainnet,
    ckbFeeRate: BigInt(2000),
    btcTestnetType,
  });

  const { commitment, ckbRawTx, clusterId, needPaymasterCell } =
    ckbVirtualTxResult;

  console.log("clusterId: ", clusterId);

  // Send BTC tx
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: [fromBtcAccount],
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
        "The cluster rgbpp lock args: ",
        newCkbRawTx.outputs[0].lock.args,
      );

      const ckbTx = await appendCkbTxWitnesses({
        ckbRawTx: newCkbRawTx,
        btcTxBytes,
        rgbppApiSpvProof,
      });
      // Replace cobuild witness with the final rgbpp lock script
      ckbTx.witnesses[ckbTx.witnesses.length - 1] =
        generateClusterCreateCoBuild(ckbTx.outputs[0], ckbTx.outputsData[0]);

      console.log(JSON.stringify(ckbTx));

      const txHash = await sendCkbTx({ collector, signedTx: ckbTx });
      console.info(`RGB++ Cluster has been created and tx hash is ${txHash}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, 30 * 1000);

  return { btcTxId };
};

/**
 * Parameters required to create a combined cluster.
 */
export interface createClusterCombinedParams {
  /**
   * CKB address where the cluster cell will be created.
   */
  ckbAddress: string;

  /**
   * Raw data required to create the cluster.
   */
  clusterData: RawClusterData;

  /**
   * Collector instance used to gather cells for the transaction.
   */
  collector: Collector;

  /**
   * Indicates whether the operation is on the mainnet.
   */
  isMainnet: boolean;

  /**
   * Type of BTC testnet (optional).
   */
  btcTestnetType?: BTCTestnetType;

  /**
   * BTC account from which the transaction will be initiated.
   */
  fromBtcAccount: string;

  /**
   * Public key of the BTC account.
   */
  fromBtcAccountPubkey: string;

  /**
   * Data source for BTC transactions.
   */
  btcDataSource: DataSource;

  /**
   * Wallet instance used for signing BTC transactions.
   */
  wallet: AbstractWallet;

  /**
   * BTC service instance for interacting with BTC assets.
   */
  btcService: BtcAssetsApi;

  /**
   * Function to filter UTXOs for the BTC transaction.
   */
  filterUtxo: (
    utxos: BtcApiUtxo[],
  ) => Promise<{ outIndex: number; btcTxId: string }>;

  /**
   * Signer instance for signing CKB transactions.
   */
  cccSigner: ccc.Signer;
}

/**
 * Creates a cluster cell on the CKB network and initiates a corresponding BTC transaction.
 *
 * @param {createClusterCombinedParams} params - Parameters required to create the cluster.
 * @param {string} params.ckbAddress - CKB address where the cluster cell will be created.
 * @param {RawClusterData} params.clusterData - Raw data required to create the cluster.
 * @param {Collector} params.collector - Collector instance used to gather cells for the transaction.
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - Type of BTC testnet (optional).
 * @param {string} params.fromBtcAccount - BTC account from which the transaction will be initiated.
 * @param {string} [params.fromBtcAccountPubkey] - Public key of the BTC account.
 * @param {DataSource} params.btcDataSource - Data source for BTC transactions.
 * @param {AbstractWallet} params.wallet - Wallet instance used for signing BTC transactions.
 * @param {BtcAssetsApi} params.btcService - BTC service instance for interacting with BTC assets.
 * @param {(utxos: BtcApiUtxo[]) => Promise<{ outIndex: number; btcTxId: string }>} params.filterUtxo - Function to filter UTXOs for the BTC transaction.
 * @param {ccc.Signer} params.cccSigner - Signer instance for signing CKB transactions.
 * @param {bigint} [ckbFeeRate] - Fee rate for the CKB transaction (optional).
 * @param {number} [btcFeeRate=30] - Fee rate for the BTC transaction (default is 30).
 * @returns {Promise<TxResult>} - Promise that resolves to the transaction result.
 */
export const createClusterCombined = async (
  {
    ckbAddress,
    clusterData,
    collector,
    isMainnet,
    btcTestnetType,
    fromBtcAccount,
    fromBtcAccountPubkey,
    btcDataSource,
    wallet,
    btcService,
    filterUtxo,
    cccSigner,
  }: createClusterCombinedParams,
  ckbFeeRate?: bigint,
  btcFeeRate: number = 30,
): Promise<TxResult> => {
  const { outIndex, btcTxId } = await fetchAndFilterUtxos(
    fromBtcAccount,
    filterUtxo,
    btcService,
  );

  const prepareClusterCellTx = convertToTransaction(
    await prepareClusterCell({
      outIndex,
      btcTxId,
      clusterData,
      ckbAddress,
      collector,
      isMainnet,
      btcTestnetType,
    }),
  );

  await prepareClusterCellTx.completeFeeBy(cccSigner, ckbFeeRate);

  const txHash = await cccSigner.sendTransaction(prepareClusterCellTx);

  console.info(
    `Create Cluster cell has been created and the CKB tx hash ${txHash}`,
  );

  const ownerRgbppLockArgs = buildRgbppLockArgs(outIndex, btcTxId);

  const { btcTxId: TxId } = await createCluster(
    {
      ownerRgbppLockArgs,
      clusterData,
      collector,
      isMainnet,
      fromBtcAccount,
      btcDataSource,
      fromBtcAccountPubkey,
      btcTestnetType,
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
 * Parameters required to prepare a cluster cell transaction.
 */
export interface PrepareClusterCellTransactionParams {
  /**
   * CKB address where the cluster cell will be created.
   */
  ckbAddress: string;

  /**
   * Raw data required to create the cluster.
   */
  clusterData: RawClusterData;

  /**
   * Collector instance used to gather cells for the transaction.
   */
  collector: Collector;

  /**
   * Indicates whether the operation is on the mainnet.
   */
  isMainnet: boolean;

  /**
   * Type of BTC testnet (optional).
   */
  btcTestnetType?: BTCTestnetType;

  /**
   * Output index of the BTC transaction.
   */
  outIndex: number;

  /**
   * ID of the BTC transaction.
   */
  btcTxId: string;
}

/**
 * Prepares a cluster cell on the CKB network by creating a transaction.
 *
 * @param {PrepareClusterCellTransactionParams} params - Parameters required to prepare the cluster cell.
 * @param {string} params.ckbAddress - CKB address where the cluster cell will be created.
 * @param {RawClusterData} params.clusterData - Raw data required to create the cluster.
 * @param {Collector} params.collector - Collector instance used to gather cells for the transaction.
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - Type of BTC testnet (optional).
 * @param {number} params.outIndex - Output index of the BTC transaction.
 * @param {string} params.btcTxId - ID of the BTC transaction.
 * @returns {Promise<CKBComponents.RawTransactionToSign>} - Promise that resolves to the prepared CKB transaction.
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
export const prepareClusterCellTransaction = async ({
  ckbAddress,
  clusterData,
  collector,
  isMainnet,
  btcTestnetType,
  outIndex,
  btcTxId,
}: PrepareClusterCellTransactionParams): Promise<
  CKBComponents.RawTransactionToSign
> => {
  const prepareClusterCellTx = await prepareClusterCell({
    outIndex,
    btcTxId,
    clusterData,
    ckbAddress,
    collector,
    isMainnet,
    btcTestnetType,
  });

  return prepareClusterCellTx;
};

/**
 * Parameters required to generate an unsigned PSBT (Partially Signed Bitcoin Transaction) for creating a cluster.
 * This interface is used to estimate transaction fees before finalizing the transaction.
 */
export interface PrepareCreateClusterUnsignedPsbtParams {
  /**
   * Collector instance used to gather cells for the transaction.
   */
  collector: Collector;

  /**
   * Raw data required to create the cluster.
   */
  clusterData: RawClusterData;

  /**
   * Indicates whether the operation is on the mainnet.
   */
  isMainnet: boolean;

  /**
   * Type of BTC testnet (optional).
   */
  btcTestnetType?: BTCTestnetType;

  /**
   * BTC account from which the transaction will be initiated.
   */
  fromBtcAccount: string;

  /**
   * Public key of the BTC account.
   */
  fromBtcAccountPubkey: string;

  /**
   * Data source for BTC transactions.
   */
  btcDataSource: DataSource;

  /**
   * Output index of the BTC transaction.
   */
  outIndex: number;

  /**
   * ID of the BTC transaction.
   */
  btcTxId: string;

  /**
   * Fee rate for the BTC transaction (optional, default is 30).
   */
  btcFeeRate?: number;
}

/**
 * Generates an unsigned PSBT (Partially Signed Bitcoin Transaction) for creating a cluster.
 * This function is used to estimate transaction fees before finalizing the transaction.
 *
 * @param {PrepareCreateClusterUnsignedPsbtParams} params - Parameters required to generate the unsigned PSBT.
 * @param {Collector} params.collector - Collector instance used to gather cells for the transaction.
 * @param {RawClusterData} params.clusterData - Raw data required to create the cluster.
 * @param {boolean} params.isMainnet - Indicates whether the operation is on the mainnet.
 * @param {BTCTestnetType} [params.btcTestnetType] - Type of BTC testnet (optional).
 * @param {string} params.fromBtcAccount - BTC account from which the transaction will be initiated.
 * @param {string} [params.fromBtcAccountPubkey] - Public key of the BTC account.
 * @param {DataSource} params.btcDataSource - Data source for BTC transactions.
 * @param {number} params.outIndex - Output index of the BTC transaction.
 * @param {string} params.btcTxId - ID of the BTC transaction.
 * @param {number} [params.btcFeeRate] - Fee rate for the BTC transaction (optional, default is 30).
 * @returns {Promise<bitcoin.Psbt>} - Promise that resolves to the unsigned PSBT in base64 format.
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
export const prepareCreateClusterUnsignedPsbt = async ({
  collector,
  clusterData,
  isMainnet,
  btcTestnetType,
  fromBtcAccount,
  fromBtcAccountPubkey,
  btcDataSource,
  outIndex,
  btcTxId,
  btcFeeRate = 30,
}: PrepareCreateClusterUnsignedPsbtParams): Promise<bitcoin.Psbt> => {
  const ckbVirtualTxResult = await genCreateClusterCkbVirtualTx({
    collector,
    rgbppLockArgs: buildRgbppLockArgs(outIndex, btcTxId),
    clusterData,
    isMainnet,
    ckbFeeRate: BigInt(2000),
    btcTestnetType,
  });

  const { commitment, ckbRawTx, needPaymasterCell } = ckbVirtualTxResult;

  // Generate unsigned PSBT
  const psbt = await sendRgbppUtxos({
    ckbVirtualTx: ckbRawTx,
    commitment,
    tos: [fromBtcAccount],
    needPaymaster: needPaymasterCell,
    ckbCollector: collector,
    from: fromBtcAccount,
    fromPubkey: fromBtcAccountPubkey,
    source: btcDataSource,
    feeRate: btcFeeRate,
  });

  return psbt;
};
