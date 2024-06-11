import { addressToScript, getTransactionSize } from '@nervosnetwork/ckb-sdk-utils';
import {
  getSecp256k1CellDep,
  RgbppTokenInfo,
  NoLiveCellError,
  calculateUdtCellCapacity,
  MAX_FEE,
  MIN_CAPACITY,
  append0x,
  u128ToLe,
  SECP256K1_WITNESS_LOCK_SIZE,
  calculateTransactionFee,
  NoXudtLiveCellError,
  fetchTypeIdCellDeps,
} from '@rgbpp-sdk/ckb';

import { Collector } from '@/libs/rgnpp_collector';
const collector = new Collector({
  ckbNodeUrl: process.env.REACT_APP_CKB_RPC_URL!,
  ckbIndexerUrl: process.env.REACT_APP_CKB_INDEXER_URL!,
});

const isMainnet = true

interface XudtTransferParams {
  fromAddress: string;
  xudtType: CKBComponents.Script;
  receivers: {
    toAddress: string;
    transferAmount: bigint;
  }[];
}

/**
 * transferXudt can be used to mint xUDT assets or transfer xUDT assets.
 * @param xudtType The xUDT type script that comes from 1-issue-xudt
 * @param receivers The receiver includes toAddress and transferAmount
 */
export const transferXudt = async ({ xudtType, receivers , fromAddress}: XudtTransferParams) => {
  const fromLock = addressToScript(fromAddress);

  const xudtCells = await collector.getCells({
    lock: fromLock,
    type: xudtType,
  });
  if (!xudtCells || xudtCells.length === 0) {
    throw new NoXudtLiveCellError('The address has no xudt cells');
  }
  const sumTransferAmount = receivers
      .map((receiver) => receiver.transferAmount)
      .reduce((prev, current) => prev + current, BigInt(0));

  let sumXudtOutputCapacity = receivers
      .map(({ toAddress }) => calculateUdtCellCapacity(addressToScript(toAddress)))
      .reduce((prev, current) => prev + current, BigInt(0));

  const {
    inputs: udtInputs,
    sumInputsCapacity: sumXudtInputsCapacity,
    sumAmount,
  } = collector.collectUdtInputs({
    liveCells: xudtCells,
    needAmount: sumTransferAmount,
  });
  let actualInputsCapacity = sumXudtInputsCapacity;
  let inputs = udtInputs;

  const outputs: CKBComponents.CellOutput[] = receivers.map(({ toAddress }) => ({
    lock: addressToScript(toAddress),
    type: xudtType,
    capacity: append0x(calculateUdtCellCapacity(addressToScript(toAddress)).toString(16)),
  }));
  const outputsData = receivers.map(({ transferAmount }) => append0x(u128ToLe(transferAmount)));

  if (sumAmount > sumTransferAmount) {
    const xudtChangeCapacity = calculateUdtCellCapacity(fromLock);
    outputs.push({
      lock: fromLock,
      type: xudtType,
      capacity: append0x(xudtChangeCapacity.toString(16)),
    });
    outputsData.push(append0x(u128ToLe(sumAmount - sumTransferAmount)));
    sumXudtOutputCapacity += xudtChangeCapacity;
  }

  const txFee = MAX_FEE;
  if (sumXudtInputsCapacity <= sumXudtOutputCapacity) {
    let emptyCells = await collector.getCells({
      lock: fromLock,
    });
    if (!emptyCells || emptyCells.length === 0) {
      throw new NoLiveCellError('The address has no empty cells');
    }
    emptyCells = emptyCells.filter((cell) => !cell.output.type);
    const needCapacity = sumXudtOutputCapacity - sumXudtInputsCapacity;
    const { inputs: emptyInputs, sumInputsCapacity: sumEmptyCapacity } = collector.collectInputs(
        emptyCells,
        needCapacity,
        txFee,
        { minCapacity: MIN_CAPACITY },
    );
    inputs = [...inputs, ...emptyInputs];
    actualInputsCapacity += sumEmptyCapacity;
  }

  let changeCapacity = actualInputsCapacity - sumXudtOutputCapacity;
  outputs.push({
    lock: fromLock,
    capacity: append0x(changeCapacity.toString(16)),
  });
  outputsData.push('0x');

  const emptyWitness = { lock: '', inputType: '', outputType: '' };
  const witnesses = inputs.map((_, index) => (index === 0 ? emptyWitness : '0x'));

  const cellDeps = [getSecp256k1CellDep(isMainnet), ...(await fetchTypeIdCellDeps(isMainnet, { xudt: true }))];

  const unsignedTx = {
    version: '0x0',
    cellDeps,
    headerDeps: [],
    inputs,
    outputs,
    outputsData,
    witnesses,
  };

  const txSize = getTransactionSize(unsignedTx) + SECP256K1_WITNESS_LOCK_SIZE;
  const estimatedTxFee = calculateTransactionFee(txSize);
  changeCapacity -= estimatedTxFee;
  unsignedTx.outputs[unsignedTx.outputs.length - 1].capacity = append0x(changeCapacity.toString(16));

  return {
    tx: unsignedTx,
    fee: estimatedTxFee
  }
};
