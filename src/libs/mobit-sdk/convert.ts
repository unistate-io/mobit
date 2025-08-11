import { ccc, hexFrom } from "@ckb-ccc/core";

/**
 * Converts a CKBComponents.RawTransactionToSign to a CKBComponents.RawTransaction.
 * @param {CKBComponents.RawTransactionToSign} rawTransactionToSign - The raw transaction to sign to convert.
 * @returns {CKBComponents.RawTransaction} The converted raw transaction.
 */
function convertToRawTransaction(
  rawTransactionToSign: CKBComponents.RawTransactionToSign,
): CKBComponents.RawTransaction {
  const witnesses: CKBComponents.Witness[] = rawTransactionToSign.witnesses.map(
    (witness) => {
      if (typeof witness === "string") {
        return witness;
      } else {
        return convertToWitness(witness);
      }
    },
  );

  return {
    version: rawTransactionToSign.version,
    cellDeps: rawTransactionToSign.cellDeps,
    headerDeps: rawTransactionToSign.headerDeps,
    inputs: rawTransactionToSign.inputs,
    outputs: rawTransactionToSign.outputs,
    outputsData: rawTransactionToSign.outputsData,
    witnesses,
  };
}

function convertToWitness(
  witnessArgs: CKBComponents.WitnessArgs,
): CKBComponents.Witness {
  const bytes = ccc.WitnessArgs.from(witnessArgs).toBytes();
  return Buffer.from(bytes).toString("hex");
}

/**
 * Converts a CKBComponents.OutPoint to a ccc.OutPointLike.
 * @param {CKBComponents.OutPoint} outPoint - The out point to convert.
 * @returns {ccc.OutPointLike} The converted out point.
 */
function convertToOutPointLike(
  outPoint: CKBComponents.OutPoint,
): ccc.OutPointLike {
  return {
    txHash: hexFrom(outPoint.txHash),
    index: hexFrom(outPoint.index),
  };
}

/**
 * Converts a CKBComponents.CellDep to a ccc.CellDepLike.
 * @param {CKBComponents.CellDep} cellDep - The cell dep to convert.
 * @returns {ccc.CellDepLike} The converted cell dep.
 */
function convertToCellDepLike(cellDep: CKBComponents.CellDep): ccc.CellDepLike {
  if (!cellDep.outPoint) {
    throw new Error("CellDep is missing required field: outPoint");
  }
  return {
    outPoint: convertToOutPointLike(cellDep.outPoint),
    depType: cellDep.depType,
  };
}

/**
 * Converts a CKBComponents.CellInput to a ccc.CellInputLike.
 * @param {CKBComponents.CellInput} cellInput - The cell input to convert.
 * @returns {ccc.CellInputLike} The converted cell input.
 */
function convertToCellInputLike(
  cellInput: CKBComponents.CellInput,
): ccc.CellInputLike {
  if (!cellInput.previousOutput) {
    throw new Error("CellInput is missing required field: previousOutput");
  }
  return {
    previousOutput: convertToOutPointLike(cellInput.previousOutput),
    since: cellInput.since ? hexFrom(cellInput.since) : undefined,
  };
}

function ConvertToTransactionLike(
  rawTransaction: CKBComponents.RawTransaction,
): ccc.TransactionLike {
  return {
    version: rawTransaction.version,
    cellDeps: rawTransaction.cellDeps.map(convertToCellDepLike),
    headerDeps: rawTransaction.headerDeps.map(hexFrom),
    inputs: rawTransaction.inputs.map(convertToCellInputLike),
    outputs: rawTransaction.outputs.map((output) => ({
      capacity: output.capacity,
      lock: {
        args: hexFrom(output.lock.args),
        codeHash: hexFrom(output.lock.codeHash),
        hashType: output.lock.hashType,
      },
      type: output.type
        ? {
            args: hexFrom(output.type.args),
            codeHash: hexFrom(output.type.codeHash),
            hashType: output.type.hashType,
          }
        : null,
    })),
    outputsData: rawTransaction.outputsData.map(hexFrom),
    witnesses: rawTransaction.witnesses.map(hexFrom),
  };
}

/**
 * Converts a CKBComponents.RawTransactionToSign to a ccc.Transaction.
 * @param {CKBComponents.RawTransactionToSign} rawTransactionToSign - The raw transaction to sign to convert.
 * @returns {ccc.Transaction} The converted transaction object.
 */
export function convertToTransaction(
  rawTransactionToSign: CKBComponents.RawTransactionToSign,
): ccc.Transaction {
  const rawTransaction = convertToRawTransaction(rawTransactionToSign);
  const transactionLike = ConvertToTransactionLike(rawTransaction);
  const tx = ccc.Transaction.from(transactionLike);
  return tx;
}
