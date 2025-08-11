import {
  BTCTestnetType,
  buildRgbppLockArgs,
  Collector,
  genCkbJumpBtcVirtualTx,
  serializeScript,
} from "@rgbpp-sdk/ckb";

/**
 * Interface for parameters required for the leap from CKB to BTC transaction.
 */
export interface LeapToBtcTransactionParams {
  /**
   * The output index in the BTC transaction.
   */
  outIndex: number;
  /**
   * The transaction ID of the BTC transaction.
   */
  btcTxId: string;
  /**
   * The type script for the XUDT (User Defined Token) on CKB.
   */
  xudtType: CKBComponents.Script;
  /**
   * The amount of assets to transfer.
   */
  transferAmount: bigint;
  /**
   * The collector instance used for collecting cells.
   */
  collector: Collector;
  /**
   * The CKB address from which the assets are being transferred.
   */
  ckbAddress: string;
  /**
   * The type of BTC testnet, if applicable.
   */
  btcTestnetType?: BTCTestnetType;
}

/**
 * Leap from CKB to BTC
 *
 * This function facilitates the transfer of assets from the CKB (Nervos Network) blockchain to the BTC (Bitcoin) blockchain.
 * It constructs the necessary arguments and transactions to move the specified amount of assets, identified by their type script,
 * from a CKB address to a BTC transaction. The function also handles the signing and sending of the transaction.
 *
 * @param {LeapToBtcTransactionParams} params - The parameters required for the leap operation.
 * @param {number} params.outIndex - The output index in the BTC transaction.
 * @param {string} params.btcTxId - The transaction ID of the BTC transaction.
 * @param {CKBComponents.Script} params.xudtType - The type script for the XUDT (User Defined Token) on CKB.
 * @param {bigint} params.transferAmount - The amount of assets to transfer.
 * @param {Collector} params.collector - The collector instance used for collecting cells.
 * @param {string} params.ckbAddress - The CKB address from which the assets are being transferred.
 * @param {BTCTestnetType} [params.btcTestnetType] - The type of BTC testnet, if applicable.
 *
 * @returns {Promise<CKBComponents.RawTransactionToSign>} - The unsigned raw transaction to sign.
 */
export const leapFromCkbToBtcTransaction = async ({
  outIndex,
  btcTxId,
  xudtType,
  transferAmount,
  collector,
  ckbAddress,
  btcTestnetType,
}: LeapToBtcTransactionParams): Promise<CKBComponents.RawTransactionToSign> => {
  const toRgbppLockArgs = buildRgbppLockArgs(outIndex, btcTxId);

  const ckbRawTx = await genCkbJumpBtcVirtualTx({
    collector,
    fromCkbAddress: ckbAddress,
    toRgbppLockArgs,
    xudtTypeBytes: serializeScript(xudtType),
    transferAmount,
    btcTestnetType,
    ckbFeeRate: BigInt(0),
    witnessLockPlaceholderSize: 0,
  });

  // Filter out outputs without a type and remove corresponding outputsData
  const filteredOutputs = ckbRawTx.outputs.filter(
    (output, index) => output.type !== undefined,
  );
  const filteredOutputsData = ckbRawTx.outputsData.filter(
    (_, index) => ckbRawTx.outputs[index].type !== undefined,
  );

  const unsignedTx: CKBComponents.RawTransactionToSign = {
    ...ckbRawTx,
    outputs: filteredOutputs,
    outputsData: filteredOutputsData,
    cellDeps: [...ckbRawTx.cellDeps],
    witnesses: [],
  };

  return unsignedTx;
};
