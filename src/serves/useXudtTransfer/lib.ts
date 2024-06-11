import {BI, Cell, helpers, Indexer, config} from '@ckb-lumos/lumos';
import {blockchain, values} from '@ckb-lumos/base';
import {bytes, number, molecule} from '@ckb-lumos/codec';
import { BytesOpt, Byte32, Bytes } from '@ckb-lumos/codec/lib/blockchain';
import {fetchTypeIdCellDeps} from "@rgbpp-sdk/ckb"

const { table, option, vector } = molecule;

const { Uint8 } = number;

const Script = table(
    {
      codeHash: Byte32,
      hashType: Uint8,
      args: Bytes,
    },
    ['codeHash', 'hashType', 'args'],
);
const ScriptOpt = option(Script);
const ScriptVecOpt = option(vector(Script));

export const xudtWitnessType = table(
    {
      owner_script: ScriptOpt,
      owner_signature: BytesOpt,
      raw_extension_data: ScriptVecOpt,
      extension_data: vector(Bytes),
    },
    ['owner_script', 'owner_signature', 'raw_extension_data', 'extension_data'],
);

export type CellDep = any
type  TransactionSkeletonType = helpers.TransactionSkeletonType

const xudtDep = {
  "CODE_HASH": "0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95",
  "HASH_TYPE": "data1",
  "TX_HASH": "0xc07844ce21b38e4b071dd0e1ee3b0e27afd8d7532491327f39b786343f558ab7",
  "INDEX": "0x0",
  "DEP_TYPE": "code"
}

const SECP256K1_BLAKE160 = {
  "CODE_HASH": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  "HASH_TYPE": "type",
  "TX_HASH": "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c",
  "INDEX": "0x0",
  "DEP_TYPE": "depGroup",
  "SHORT_ID": 1
}

const OMNILOCK = config.MAINNET.SCRIPTS.OMNILOCK

const CKB_RPC_URL = process.env.REACT_APP_CKB_RPC_URL!
const CKB_INDEXER_URL = process.env.REACT_APP_CKB_INDEXER_URL!

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);


export async function transferTokenToAddress(
    fromAddress: string,
    amount: string,
    receiverAddress: string,
) {
  console.log('OMNILOCK', OMNILOCK)

  const senderLockScript  = helpers.parseAddress(fromAddress)
  // console.log('senderLockScript', senderLockScript)
  const receiverLockScript = helpers.parseAddress(receiverAddress);
  // console.log('receiverLockScript', receiverLockScript)

  const lockDeps = OMNILOCK;

  const typeScript: any = {
    codeHash: '0x50bd8d6680b8b9cf98b73f3c08faf8b2a21914311954118ad6609be6e78a1b95',
    hashType: 'data1',
    args: '0x6b33c69bdb25fac3d73e3c9e55f88785de27a54d722b4ab3455212f9a1b1645c',
  };

  let txSkeleton = helpers.TransactionSkeleton({cellProvider: indexer});
  txSkeleton = addCellDep(txSkeleton, {
    outPoint: {
      txHash: lockDeps.TX_HASH,
      index: lockDeps.INDEX,
    },
    depType: lockDeps.DEP_TYPE,
  });

  txSkeleton = addCellDep(txSkeleton, {
    outPoint: {
      txHash: '0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c',
      index: "0x0",
    },
    depType: 'depGroup',
  });

  const xdutDeps = await fetchTypeIdCellDeps(true, { xudt: true })

  // console.log('xdutDepsxdutDeps', xdutDeps)

  txSkeleton = addCellDep(txSkeleton, xdutDeps[0]);

  const targetOutput: Cell = {
    cellOutput: {
      capacity: '0x0',
      lock: receiverLockScript,
      type: typeScript,
    },
    data: bytes.hexify(number.Uint128LE.pack(amount)),
  };

  const capacity = helpers.minimalCellCapacity(targetOutput);
  targetOutput.cellOutput.capacity = '0x' + capacity.toString(16);
  // additional 0.001 ckb for tx fee
  // the tx fee could calculated by tx size
  // this is just a simple example
  // todo calculate fee
  const neededCapacity = BI.from(capacity.toString(10)).add(100000);
  let collectedSum = BI.from(0);
  let collectedAmount = BI.from(0);
  const collected: Cell[] = [];
  const collector = indexer.collector({ lock: senderLockScript, type: typeScript });
  console.log('xudt cells ->', collector)
  for await (const cell of collector.collect()) {
    collectedSum = collectedSum.add(cell.cellOutput.capacity);
    collectedAmount = collectedAmount.add(number.Uint128LE.unpack(cell.data));
    console.log('cell', cell)
    collected.push(cell);
    if (collectedAmount >= BI.from(amount)) break;
  }

  let changeOutputTokenAmount = BI.from(0);
  if (collectedAmount.gt(BI.from(amount))) {
    changeOutputTokenAmount = collectedAmount.sub(BI.from(amount));
  }

  const changeOutput: Cell = {
    cellOutput: {
      capacity: '0x0',
      lock: senderLockScript,
      type: typeScript,
    },
    data: bytes.hexify(number.Uint128LE.pack(changeOutputTokenAmount.toString(10))),
  };

  const changeOutputNeededCapacity = BI.from(helpers.minimalCellCapacity(changeOutput));

  const extraNeededCapacity = collectedSum.lt(neededCapacity)
      ? neededCapacity.sub(collectedSum).add(changeOutputNeededCapacity)
      : collectedSum.sub(neededCapacity).add(changeOutputNeededCapacity);

  if (extraNeededCapacity.gt(0)) {
    let extraCollectedSum = BI.from(0);
    const extraCollectedCells: Cell[] = [];
    const collector = indexer.collector({ lock: senderLockScript, type: 'empty' });
    console.log('ckb cells ->', collector)
    for await (const cell of collector.collect()) {
      extraCollectedSum = extraCollectedSum.add(cell.cellOutput.capacity);
      extraCollectedCells.push(cell);
      console.log('cell', cell)
      if (extraCollectedSum >= extraNeededCapacity) break;
    }

    if (extraCollectedSum.lt(extraNeededCapacity)) {
      throw new Error(`Not enough CKB for change, ${extraCollectedSum} < ${extraNeededCapacity}`);
    }

    txSkeleton = txSkeleton.update('inputs', (inputs) => inputs.push(...extraCollectedCells));

    const change2Capacity = extraCollectedSum.sub(extraNeededCapacity);
    if (change2Capacity.gt(61000000000)) {
      changeOutput.cellOutput.capacity = changeOutputNeededCapacity.toHexString();
      const changeOutput2: Cell = {
        cellOutput: {
          capacity: change2Capacity.toHexString(),
          lock: senderLockScript,
        },
        data: '0x',
      };
      txSkeleton = txSkeleton.update('outputs', (outputs) => outputs.push(changeOutput2));
    } else {
      changeOutput.cellOutput.capacity = extraCollectedSum.toHexString();
    }
  }

  txSkeleton = txSkeleton.update('inputs', (inputs) => inputs.push(...collected));
  txSkeleton = txSkeleton.update('outputs', (outputs) => outputs.push(targetOutput, changeOutput));
  /* 65-byte zeros in hex */
  const lockWitness =
      '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

  const inputTypeWitness = xudtWitnessType.pack({ extension_data: [] });
  const outputTypeWitness = xudtWitnessType.pack({ extension_data: [] });
  const witnessArgs = blockchain.WitnessArgs.pack({
    lock: lockWitness,
    inputType: inputTypeWitness,
    outputType: outputTypeWitness,
  });
  const witness = bytes.hexify(witnessArgs);
  txSkeleton = txSkeleton.update('witnesses', (witnesses) => witnesses.set(0, witness));

  // signing
  // txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

  // console.log('txSkeleton', JSON.stringify(txSkeleton))

  return txSkeleton;
}

export function addCellDep(txSkeleton: TransactionSkeletonType, newCellDep: CellDep): TransactionSkeletonType {
  const cellDep = txSkeleton.get('cellDeps').find((cellDep) => {
    return (
        cellDep.depType === newCellDep.depType &&
        new values.OutPointValue(cellDep.outPoint, { validate: false }).equals(
            new values.OutPointValue(newCellDep.outPoint, { validate: false }),
        )
    );
  });

  if (!cellDep) {
    txSkeleton = txSkeleton.update('cellDeps', (cellDeps) => {
      return cellDeps.push({
        outPoint: newCellDep.outPoint,
        depType: newCellDep.depType,
      });
    });
  }

  return txSkeleton;
}
