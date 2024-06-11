import {BI, Cell, config, helpers, Indexer} from '@ckb-lumos/lumos';
import {blockchain, values} from '@ckb-lumos/base';
import {bytes, molecule, number} from '@ckb-lumos/codec';
import {Byte32, Bytes, BytesOpt} from '@ckb-lumos/codec/lib/blockchain';
import {fetchTypeIdCellDeps} from "@rgbpp-sdk/ckb"
import {queryAddressInfoWithAddress, queryTokenInfo} from "@/utils/graphql";
import {TokenInfo} from "@/utils/graphql/types";

const {table, option, vector} = molecule;

const {Uint8} = number;

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

const hashType: any = {
    '0': 'data',
    '1': 'type',
    '2': 'data1',
    '3': 'data2'
}

const OMNILOCK = config.MAINNET.SCRIPTS.OMNILOCK

const CKB_RPC_URL = process.env.REACT_APP_CKB_RPC_URL!
const CKB_INDEXER_URL = process.env.REACT_APP_CKB_INDEXER_URL!

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);


export async function transferTokenToAddress(
    fromAddress: string,
    amount: string,
    receiverAddress: string,
    tokenInfo: TokenInfo
) {

    const tokenDetail= await queryAddressInfoWithAddress([tokenInfo.type_id])

    if (!tokenDetail[0]) {
        throw new Error('Token not found')
    }

    const typeScript: any = {
        codeHash: tokenDetail[0].address.script_code_hash.replace('\\', '0'),
        hashType: hashType[tokenDetail[0].address.script_hash_type],
        args: tokenDetail[0].address.script_args.replace('\\', '0'),
    }

    const senderLockScript = helpers.parseAddress(fromAddress)
    // console.log('senderLockScript', senderLockScript)
    const receiverLockScript = helpers.parseAddress(receiverAddress);
    // console.log('receiverLockScript', receiverLockScript)

    const lockDeps = OMNILOCK;


    let txSkeleton = helpers.TransactionSkeleton({cellProvider: indexer});

    txSkeleton = addCellDep(txSkeleton, {
        outPoint: {
            txHash: lockDeps.TX_HASH,
            index: lockDeps.INDEX,
        },
        depType: lockDeps.DEP_TYPE,
    });

    // omni_lock need to add a SECP256K1_BLAKE160 dep cell
    txSkeleton = addCellDep(txSkeleton, {
        outPoint: {
            txHash: config.MAINNET.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
            index: "0x0",
        },
        depType: 'depGroup',
    });

    const xdutDeps = await fetchTypeIdCellDeps(true, {xudt: true})

    // console.log('xdutDepsxdutDeps', xdutDeps)

    txSkeleton = addCellDep(txSkeleton, xdutDeps[0]);

    // build xudt output cell
    const targetOutput: Cell = {
        cellOutput: {
            capacity: '0x0',
            lock: receiverLockScript,
            type: typeScript,
        },
        data: bytes.hexify(number.Uint128LE.pack(amount)),
    };

    const targetOutputCapacity = helpers.minimalCellCapacity(targetOutput);
    targetOutput.cellOutput.capacity = '0x' + targetOutputCapacity.toString(16);

    console.log('targetOutputCapacity', targetOutputCapacity.toString())


    // additional 0.001 ckb for tx fee
    // the tx fee could calculated by tx size
    // this is just a simple example
    // todo calculate fee
    // const neededCapacity = BI.from(capacity.toString(10)).add(100000);

    const neededCapacity = BI.from(targetOutputCapacity.toString(10));
    console.log('neededCapacity', neededCapacity.toString())
    let collectedSum = BI.from(0);
    let collectedAmount = BI.from(0);
    const collected: Cell[] = [];
    const collector = indexer.collector({lock: senderLockScript, type: typeScript});
    console.log('xudt cells ->', collector)
    for await (const cell of collector.collect()) {
        collectedSum = collectedSum.add(cell.cellOutput.capacity);
        collectedAmount = collectedAmount.add(number.Uint128LE.unpack(cell.data));
        console.log('cell', cell)
        collected.push(cell);
        if (collectedAmount >= BI.from(amount)) break;
    }

    // 判断xudt是否需要找零
    let changeOutputTokenAmount = BI.from(0);
    if (collectedAmount.gt(BI.from(amount))) {
        changeOutputTokenAmount = collectedAmount.sub(BI.from(amount));
    }

    // xudt是否需要找零cell
    const changeOutput: Cell = {
        cellOutput: {
            capacity: '0x0',
            lock: senderLockScript,
            type: typeScript,
        },
        data: bytes.hexify(number.Uint128LE.pack(changeOutputTokenAmount.toString(10))),
    };

    const changeOutputNeededCapacity = BI.from(helpers.minimalCellCapacity(changeOutput));
    console.log('changeOutputNeededCapacity', changeOutputNeededCapacity.toString(10))

    const extraNeededCapacity = collectedSum.lt(neededCapacity) // neededCapacity === targetOutputCapacity
        ? neededCapacity.sub(collectedSum).add(changeOutputNeededCapacity)
        : collectedSum.sub(neededCapacity).add(changeOutputNeededCapacity);

    if (extraNeededCapacity.gt(0)) {
        let extraCollectedSum = BI.from(0);
        const extraCollectedCells: Cell[] = [];
        const collector = indexer.collector({lock: senderLockScript, type: 'empty'});
        console.log('ckb cells ->', collector)
        for await (const cell of collector.collect()) {
            extraCollectedSum = extraCollectedSum.add(cell.cellOutput.capacity);
            extraCollectedCells.push(cell);
            console.log('ckb cell', cell)
            if (extraCollectedSum.gte(extraNeededCapacity)) {
                console.log('break', extraCollectedSum >= extraNeededCapacity)
                break;
            }
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

    const inputTypeWitness = xudtWitnessType.pack({extension_data: []});
    const outputTypeWitness = xudtWitnessType.pack({extension_data: []});
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
            new values.OutPointValue(cellDep.outPoint, {validate: false}).equals(
                new values.OutPointValue(newCellDep.outPoint, {validate: false}),
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
