import { addressToScript } from "@nervosnetwork/ckb-sdk-utils";
import {
  append0x,
  calculateUdtCellCapacity,
  Collector,
  IndexerCell,
  leToU128,
  NoXudtLiveCellError,
  remove0x,
  u128ToLe,
} from "@rgbpp-sdk/ckb";
import { getCellDeps, getIndexerCells } from "../helper";

/**
 * Parameters for creating a merged xUDT transaction.
 */
export interface CreateMergeXudtTransactionParams {
  /**
   * The xUDT type script.
   */
  xudtType: CKBComponents.Script;
  /**
   * The CKB addresses involved in the transaction.
   */
  ckbAddresses: string[];
  /**
   * The collector instance used to fetch cells and collect inputs.
   */
  collector: Collector;
  /**
   * A boolean indicating whether the transaction is for the mainnet or testnet.
   */
  isMainnet: boolean;
}

/**
 * Merges multiple xUDT cells into a single xUDT cell and returns the remaining capacity as a separate cell.
 * @param {CreateMergeXudtTransactionParams} params - The parameters object.
 * @param {CKBComponents.Script} params.xudtType - The xUDT type script.
 * @param {string[]} params.ckbAddresses - The CKB addresses involved in the transaction.
 * @param {Collector} params.collector - The collector instance used to fetch cells and collect inputs.
 * @param {boolean} params.isMainnet - A boolean indicating whether the transaction is for the mainnet or testnet.
 * @param {string} [ckbAddress=params.ckbAddresses[0]] - The address for the output cell, defaulting to the first address in the input address set.
 * @returns {Promise<CKBComponents.RawTransactionToSign>} An unsigned transaction object.
 */
export async function createMergeXudtTransaction(
  {
    xudtType,
    ckbAddresses,
    collector,
    isMainnet,
  }: CreateMergeXudtTransactionParams,
  ckbAddress: string = ckbAddresses[0],
): Promise<CKBComponents.RawTransactionToSign> {
  const fromLock = addressToScript(ckbAddress);

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

  if (xudtCells.length === 1) {
    throw new Error("Only one xudt cell found, no need to merge");
  }

  const {
    inputs: udtInputs,
    sumInputsCapacity,
    sumAmount,
  } = collectAllUdtInputs(xudtCells);

  const inputs = udtInputs;

  console.debug("Collected inputs:", inputs);
  console.debug("Sum of inputs capacity:", sumInputsCapacity);
  console.debug("Sum of amount:", sumAmount);

  const outputs: CKBComponents.CellOutput[] = [
    {
      lock: fromLock,
      type: xudtType,
      capacity: "0x0",
    },
  ];
  const outputsData: string[] = [append0x(u128ToLe(sumAmount))];

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

function collectAllUdtInputs(liveCells: IndexerCell[]): {
  inputs: CKBComponents.CellInput[];
  sumInputsCapacity: bigint;
  sumAmount: bigint;
} {
  const inputs = [];
  let sumInputsCapacity = BigInt(0);
  let sumAmount = BigInt(0);
  for (const cell of liveCells) {
    if (cell.outputData === "0x") {
      continue;
    }
    inputs.push({
      previousOutput: {
        txHash: cell.outPoint.txHash,
        index: cell.outPoint.index,
      },
      since: "0x0",
    });
    sumInputsCapacity = sumInputsCapacity + BigInt(cell.output.capacity);
    // XUDT cell.data = <amount: uint128> <xudt data (optional)>
    // Ref: https://blog.cryptape.com/enhance-sudts-programmability-with-xudt#heading-xudt-cell
    sumAmount += leToU128(remove0x(cell.outputData).slice(0, 32));
  }

  return { inputs, sumInputsCapacity, sumAmount };
}
