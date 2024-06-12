import {BI, Cell, config, helpers, Indexer} from '@ckb-lumos/lumos';
import {blockchain, values} from '@ckb-lumos/base';
import {bytes, molecule, number} from '@ckb-lumos/codec';
import {Byte32, Bytes, BytesOpt} from '@ckb-lumos/codec/lib/blockchain';
import {fetchTypeIdCellDeps} from "@rgbpp-sdk/ckb"
import {queryAddressInfoWithAddress} from "@/utils/graphql";
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

    const tokenDetail = await queryAddressInfoWithAddress([tokenInfo.type_id])

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

    const targetXudtCellNeededCapacity = BI.from(targetOutputCapacity.toString(10));
    console.log('neededCapacity', targetXudtCellNeededCapacity.toString())


    let xudtCollectedCapSum = BI.from(0);
    let xudtCollectedAmount = BI.from(0);
    const collected: Cell[] = [];
    const collector = indexer.collector({lock: senderLockScript, type: typeScript});
    console.log('xudt cells ->', collector)
    for await (const cell of collector.collect()) {
        xudtCollectedCapSum = xudtCollectedCapSum.add(cell.cellOutput.capacity);
        xudtCollectedAmount = xudtCollectedAmount.add(number.Uint128LE.unpack(cell.data));
        console.log('cell', cell)
        collected.push(cell);
        if (xudtCollectedAmount >= BI.from(amount)) break;
    }

    console.log('xudtCollectedCapSum', xudtCollectedCapSum.toString())

    // 判断xudt是否需要找零
    let xudtChangeOutputTokenAmount = BI.from(0);
    if (xudtCollectedAmount.gt(BI.from(amount))) {
        xudtChangeOutputTokenAmount = xudtCollectedAmount.sub(BI.from(amount));
    }

    // xudt是否需要找零cell
    const changeOutput: Cell = {
        cellOutput: {
            capacity: '0x0',
            lock: senderLockScript,
            type: typeScript,
        },
        data: bytes.hexify(number.Uint128LE.pack(xudtChangeOutputTokenAmount.toString(10))),
    };
    // xudt找零cell的最小capacity
    const changeXudtOutputNeededCapacity = BI.from(helpers.minimalCellCapacity(changeOutput));
    console.log('changeOutputNeededCapacity', changeXudtOutputNeededCapacity.toString(10))

    // what the fuck ?
    // const extraNeededCapacity = xudtCollectedCapSum.lt(targetXudtCellNeededCapacity) // neededCapacity === targetOutputCapacity
    //     ? targetXudtCellNeededCapacity.sub(xudtCollectedCapSum).add(changeOutputNeededCapacity)
    //     : xudtCollectedCapSum.sub(targetXudtCellNeededCapacity).add(changeOutputNeededCapacity);

    let extraNeededCapacity = targetXudtCellNeededCapacity.add(changeXudtOutputNeededCapacity).sub(xudtCollectedCapSum)
    console.log('extraNeededCapacity', extraNeededCapacity.toString(10))

    if (
        extraNeededCapacity.gt(0) ||
        xudtCollectedCapSum.sub(targetXudtCellNeededCapacity).lt(changeXudtOutputNeededCapacity)
    ) {

        if (xudtCollectedCapSum.sub(targetXudtCellNeededCapacity).lt(changeXudtOutputNeededCapacity)) {
            extraNeededCapacity = xudtCollectedCapSum
                .sub(targetXudtCellNeededCapacity)
                .sub(changeXudtOutputNeededCapacity)
                .sub(100000)
                .mul(-1)
            console.log('extraNeededCapacity after', extraNeededCapacity.toString(10))
            console.log('targetXudtCellNeededCapacity after', targetXudtCellNeededCapacity.toString(10))
        }

        let extraCollectedCapSum = BI.from(0);
        const extraCollectedCells: Cell[] = [];
        const collector = indexer.collector({lock: senderLockScript, type: 'empty'});
        console.log('ckb cells ->', collector)
        for await (const cell of collector.collect()) {
            extraCollectedCapSum = extraCollectedCapSum.add(cell.cellOutput.capacity);
            extraCollectedCells.push(cell);
            console.log('ckb cell', cell)
            if (extraCollectedCapSum.gte(extraNeededCapacity)) {
                console.log('break', extraCollectedCapSum >= extraNeededCapacity)
                break;
            }
        }

        console.log('extraCollectedSum', extraCollectedCapSum.toString(10))
        console.log('extraNeededCapacity', extraNeededCapacity.toString(10))

        if (extraCollectedCapSum.lt(extraNeededCapacity)) {
            throw new Error(`Not enough CKB for change, ${extraCollectedCapSum} < ${extraNeededCapacity}`);
        }

        txSkeleton = txSkeleton.update('inputs', (inputs) => inputs.push(...extraCollectedCells));

        const change2Capacity = extraCollectedCapSum.sub(extraNeededCapacity);
        console.log('extraCollectedCapSum', extraCollectedCapSum.toString(10))
        if (change2Capacity.gt(6100000000)) {
            changeOutput.cellOutput.capacity = changeXudtOutputNeededCapacity.toHexString();
            const changeOutput2: Cell = {
                cellOutput: {
                    capacity: change2Capacity.toHexString(),
                    lock: senderLockScript,
                },
                data: '0x',
            };
            txSkeleton = txSkeleton.update('outputs', (outputs) => outputs.push(changeOutput2));
        } else {
            changeOutput.cellOutput.capacity = extraCollectedCapSum.toHexString();
        }
    } else {
        // xudt input cell 的 capacity 减去 target cell capacity
        changeOutput.cellOutput.capacity = xudtCollectedCapSum.
        sub(targetXudtCellNeededCapacity)
            .sub(100000) // fee 0.001
            .toHexString();
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
    const inputs = txSkeleton.get('inputs').toArray().map((input) => {
        return Number(input.cellOutput.capacity.toString())
    });
    const outputs = txSkeleton.get('outputs').toArray().map((out) => {
        return Number(out.cellOutput.capacity.toString())
    });
    console.log('inputs cap', inputs)
    console.log('outputs cap', outputs)

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
