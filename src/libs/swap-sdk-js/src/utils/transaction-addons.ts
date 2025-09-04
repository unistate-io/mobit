import {
  append0x,
  calculateTransactionFee,
  getSecp256k1CellDep,
  getUniqueTypeDep,
  getXudtDep,
} from '@rgbpp-sdk/ckb';
import { getTransactionSize } from '@nervosnetwork/ckb-sdk-utils';

export const getCCBTCCellDeps = (isMainnet: boolean): CKBComponents.CellDep => {
  return isMainnet
    ? {
        outPoint: {
          txHash:
            '0x3ceb520f240b168e0bddf0d89b4bcabbe7d4fa69751057cbe8e4f27239fad0e9',
          index: '0x0',
        },
        depType: 'code',
      }
    : {
        outPoint: {
          txHash:
            '0x877c4c3c6f7159f29ea711f0cd21a54f93dcf950642c6a3a5abc9c070051372e',
          index: '0x0',
        },
        depType: 'code',
      };
};

export const getJoyIDCellDep = (isMainnet: boolean): CKBComponents.CellDep =>
  isMainnet
    ? {
        outPoint: {
          txHash:
            '0xaac4f0e31adda9ac98e4c446063e2725f9e98a01d1aa94ef34077c7c6a1d6b9f',
          index: '0x0',
        },
        depType: 'depGroup',
      }
    : {
        outPoint: {
          txHash:
            '0x759f281588c96979764cb21c196478cf8e13ea81fede7f4ba26d1ff29dbc6a81',
          index: '0x0',
        },
        depType: 'depGroup',
      };

export const getRUSDCellDeps = (isMainnet: boolean): CKBComponents.CellDep => {
  return isMainnet
    ? {
        outPoint: {
          txHash:
            '0x8ec1081bd03e5417bb4467e96f4cec841acdd35924538a35e7547fe320118977',
          index: '0x0',
        },
        depType: 'code',
      }
    : {
        outPoint: {
          txHash:
            '0xed7d65b9ad3d99657e37c4285d585fea8a5fcaf58165d54dacf90243f911548b',
          index: '0x0',
        },
        depType: 'code',
      };
};

export const getUSDICellDeps = (isMainnet: boolean): CKBComponents.CellDep => {
  return isMainnet
    ? {
        outPoint: {
          txHash:
            '0xf6a5eef65101899db9709c8de1cc28f23c1bee90d857ebe176f6647ef109e20d',
          index: '0x0',
        },
        depType: 'code',
      }
    : {
        outPoint: {
          txHash:
            '0xaec423c2af7fe844b476333190096b10fc5726e6d9ac58a9b71f71ffac204fee',
          index: '0x0',
        },
        depType: 'code',
      };
};

export const appendCellDepsAndWitnessToUnsignedTx = (
  unsignedTx: CKBComponents.RawTransactionToSign,
  changeCapacity: bigint,
  feeRate: bigint,
  isMainnet: boolean
): CKBComponents.RawTransactionToSign => {
  const cellDeps: CKBComponents.CellDep[] = [
    getUniqueTypeDep(isMainnet),
    getSecp256k1CellDep(isMainnet),
    getXudtDep(isMainnet),
    getCCBTCCellDeps(isMainnet),
    getJoyIDCellDep(isMainnet),
    getRUSDCellDeps(isMainnet),
    getUSDICellDeps(isMainnet),
  ];

  const witnesses: (
    | CKBComponents.WitnessArgs
    | CKBComponents.Witness
  )[] = unsignedTx.inputs.map(() => '0x');

  const unsignedTxWithCellDepsAndWitness = {
    ...unsignedTx,
    cellDeps,
    witnesses,
  };

  const txSize = getTransactionSize(unsignedTxWithCellDepsAndWitness) + 255;

  const estimatedTxFee = calculateTransactionFee(txSize, feeRate);

  changeCapacity -= estimatedTxFee;
  unsignedTxWithCellDepsAndWitness.outputs[
    unsignedTxWithCellDepsAndWitness.outputs.length - 1
  ].capacity = append0x(changeCapacity.toString(16));

  return unsignedTxWithCellDepsAndWitness;
};
