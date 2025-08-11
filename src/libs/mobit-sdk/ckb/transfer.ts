import { addressToScript } from "@nervosnetwork/ckb-sdk-utils";
import {
  append0x,
  calculateUdtCellCapacity,
  Collector,
  NoXudtLiveCellError,
  u128ToLe,
} from "@rgbpp-sdk/ckb";
import { getCellDeps, getIndexerCells } from "../helper";

/**
 * Parameters for creating a transaction to transfer xUDT assets.
 */
export interface CreateTransferXudtTransactionParams {
  /**
   * The xUDT type script.
   */
  xudtType: CKBComponents.Script;
  /**
   * An array of receiver objects containing `toAddress` and `transferAmount`.
   */
  receivers: { toAddress: string; transferAmount: bigint }[];
  /**
   * The CKB addresses for the transaction.
   */
  ckbAddresses: string[];
  /**
   * The collector instance used to fetch cells and collect inputs.
   */
  collector: Collector;
  /**
   * A boolean indicating whether the network is mainnet or testnet.
   */
  isMainnet: boolean;
}

/**
 * Creates an unsigned transaction for transferring xUDT assets. This function can also be used to mint xUDT assets.
 *
 * @param {CreateTransferXudtTransactionParams} params - The parameters for creating the transaction.
 * @param {CKBComponents.Script} params.xudtType - The xUDT type script.
 * @param {Array<{ toAddress: string, transferAmount: bigint }>} params.receivers - An array of receiver objects containing `toAddress` and `transferAmount`.
 * @param {Array<string>} params.ckbAddresses - The CKB addresses for the transaction.
 * @param {Collector} params.collector - The collector instance used to fetch cells and collect inputs.
 * @param {boolean} params.isMainnet - A boolean indicating whether the network is mainnet or testnet.
 * @param {string} [ckbAddress=params.ckbAddresses[0]] - The address for the output cell, defaulting to the first address in the input address set.
 *
 * @returns {Promise<CKBComponents.RawTransactionToSign>} A promise that resolves to an unsigned transaction object.
 *
 * @throws {NoXudtLiveCellError} If the address has no xudt cells.
 * @throws {NoLiveCellError} If the address has no empty cells.
 */
export async function createTransferXudtTransaction(
  {
    xudtType,
    receivers,
    ckbAddresses,
    collector,
    isMainnet,
  }: CreateTransferXudtTransactionParams,
  ckbAddress: string = ckbAddresses[0],
): Promise<CKBComponents.RawTransactionToSign> {
  const xudtCells = await getIndexerCells({
    ckbAddresses,
    type: xudtType,
    collector,
    isMainnet,
  });

  console.debug("Fetched xudt cells:", xudtCells);

  if (!xudtCells || xudtCells.length === 0) {
    throw new NoXudtLiveCellError("The addresses have no xudt cells");
  }

  const sumTransferAmount = receivers
    .map((receiver) => receiver.transferAmount)
    .reduce((prev, current) => prev + current, BigInt(0));

  console.debug("Sum Transfer Amount:", sumTransferAmount);

  let sumXudtOutputCapacity = receivers
    .map(({ toAddress }) =>
      calculateUdtCellCapacity(addressToScript(toAddress)),
    )
    .reduce((prev, current) => prev + current, BigInt(0));

  console.debug("Sum XUDT Output Capacity:", sumXudtOutputCapacity);

  const {
    inputs: udtInputs,
    sumInputsCapacity: sumXudtInputsCapacity,
    sumAmount,
  } = collector.collectUdtInputs({
    liveCells: xudtCells,
    needAmount: sumTransferAmount,
  });

  console.debug("Sum XUDT Inputs Capacity:", sumXudtInputsCapacity);
  console.debug("Sum Amount:", sumAmount);

  let inputs = udtInputs;

  const outputs: CKBComponents.CellOutput[] = receivers.map(
    ({ toAddress }) => ({
      lock: addressToScript(toAddress),
      type: xudtType,
      capacity: "0x0",
    }),
  );

  const outputsData = receivers.map(({ transferAmount }) =>
    append0x(u128ToLe(transferAmount)),
  );

  console.debug("Outputs:", outputs);
  console.debug("Outputs Data:", outputsData);

  if (sumAmount > sumTransferAmount) {
    outputs.push({
      lock: addressToScript(ckbAddress),
      type: xudtType,
      capacity: "0x0",
    });
    outputsData.push(append0x(u128ToLe(sumAmount - sumTransferAmount)));

    console.debug("Updated Outputs:", outputs);
    console.debug("Updated Outputs Data:", outputsData);
  }

  const cellDeps = [...(await getCellDeps(isMainnet, xudtType.args))];

  console.debug("Cell Deps:", cellDeps);

  const unsignedTx = {
    version: "0x0",
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData,
    witnesses: [],
  };

  console.debug("Unsigned Transaction:", unsignedTx);

  return unsignedTx;
}
