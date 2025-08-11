import { addressToScript } from "@nervosnetwork/ckb-sdk-utils";
import {
  append0x,
  Collector,
  NoXudtLiveCellError,
  u128ToLe,
} from "@rgbpp-sdk/ckb";
import { getCellDeps } from "../helper";

/**
 * Interface for parameters required to create a burn transaction for xUDT assets.
 */
export interface CreateBurnXudtTransactionParams {
  /**
   * The xUDT type script, which is the unique identifier for the xUDT token type.
   */
  xudtType: CKBComponents.Script;

  /**
   * The amount of xUDT asset to be burned, representing the quantity of tokens that will be destroyed.
   */
  burnAmount: bigint;

  /**
   * The CKB address for the transaction, from which the tokens will be burned.
   */
  ckbAddress: string;

  /**
   * The collector instance used to fetch cells and collect inputs, responsible for gathering the necessary cells to construct the transaction.
   */
  collector: Collector;

  /**
   * A boolean indicating whether the network is mainnet or testnet, affecting the type script and cell dependencies.
   */
  isMainnet: boolean;
}

/**
 * Creates an unsigned transaction for burning xUDT assets.
 *
 * This function constructs a transaction that burns a specified amount of xUDT tokens from a given CKB address.
 * It fetches the necessary cells, collects inputs, and constructs the transaction outputs accordingly.
 *
 * @param {CreateBurnXudtTransactionParams} params - The parameters for creating the burn transaction.
 * @param {CKBComponents.Script} params.xudtType - The xUDT type script, which is the unique identifier for the xUDT token type.
 * @param {bigint} params.burnAmount - The amount of xUDT asset to be burned, representing the quantity of tokens that will be destroyed.
 * @param {string} params.ckbAddress - The CKB address for the transaction, from which the tokens will be burned.
 * @param {Collector} params.collector - The collector instance used to fetch cells and collect inputs, responsible for gathering the necessary cells to construct the transaction.
 * @param {boolean} params.isMainnet - A boolean indicating whether the network is mainnet or testnet, affecting the type script and cell dependencies.
 * @returns {Promise<CKBComponents.RawTransactionToSign>} - An unsigned transaction object that can be signed and submitted to the network.
 */
export async function createBurnXudtTransaction({
  xudtType,
  burnAmount,
  ckbAddress,
  collector,
  isMainnet,
}: CreateBurnXudtTransactionParams): Promise<
  CKBComponents.RawTransactionToSign
> {
  const fromLock = addressToScript(ckbAddress);
  const xudtCells = await collector.getCells({
    lock: fromLock,
    type: xudtType,
  });

  console.debug("Fetched xudt cells:", xudtCells);

  if (!xudtCells || xudtCells.length === 0) {
    throw new NoXudtLiveCellError("The address has no xudt cells");
  }

  const { inputs: udtInputs, sumAmount } = collector.collectUdtInputs({
    liveCells: xudtCells,
    needAmount: burnAmount,
  });

  let inputs = udtInputs;

  console.debug("Collected inputs:", inputs);
  console.debug("Sum of amount:", sumAmount);

  if (sumAmount < burnAmount) {
    throw new Error("Not enough xUDT tokens to burn");
  }

  const outputs: CKBComponents.CellOutput[] = [];
  const outputsData: string[] = [];

  if (sumAmount > burnAmount) {
    outputs.push({
      lock: fromLock,
      type: xudtType,
      capacity: "0x0",
    });
    outputsData.push(append0x(u128ToLe(sumAmount - burnAmount)));

    console.debug("Updated outputs:", outputs);
    console.debug("Updated outputs data:", outputsData);
  }

  const cellDeps = [...(await getCellDeps(isMainnet, xudtType.args))];

  const unsignedTx: CKBComponents.RawTransactionToSign = {
    version: "0x0",
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData,
    witnesses: [],
  };

  console.debug("Unsigned transaction:", unsignedTx);

  return unsignedTx;
}
