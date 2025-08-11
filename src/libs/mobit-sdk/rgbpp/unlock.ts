// import {
//   BTCTestnetType,
//   buildBtcTimeCellsSpentTx,
//   Collector,
//   getBtcTimeLockScript,
//   signBtcTimeCellSpentTx,
// } from "@rgbpp-sdk/ckb";
// import { BtcAssetsApi } from "rgbpp";

// interface unlockBtcTimeCellParams {
//   btcTimeCellArgs: string;
//   collector: Collector;
//   isMainnet: boolean;
//   btcTestnetType?: BTCTestnetType;
//   btcService: BtcAssetsApi;
//   ckbAddress: string;
// }

// const unlockBtcTimeCell = async (
//   {
//     btcTimeCellArgs,
//     collector,
//     isMainnet,
//     btcTestnetType,
//     ckbAddress,
//     btcService,
//   }: unlockBtcTimeCellParams,
// ) => {
//   const btcTimeCells = await collector.getCells({
//     lock: {
//       ...getBtcTimeLockScript(isMainnet, btcTestnetType),
//       args: btcTimeCellArgs,
//     },
//     isDataMustBeEmpty: false,
//   });

//   if (!btcTimeCells || btcTimeCells.length === 0) {
//     throw new Error("No btc time cell found");
//   }

//   const ckbRawTx: CKBComponents.RawTransaction = await buildBtcTimeCellsSpentTx(
//     {
//       btcTimeCells,
//       btcAssetsApi: btcService,
//       isMainnet,
//       btcTestnetType,
//     },
//   );

//   const signedTx = await signBtcTimeCellSpentTx({
//     secp256k1PrivateKey: CKB_PRIVATE_KEY,
//     collector,
//     masterCkbAddress: ckbAddress,
//     ckbRawTx,
//     isMainnet,
//   });

//   const txHash = await sendCkbTx({ collector, signedTx });
//   console.info(`BTC time cell has been spent and CKB tx hash is ${txHash}`);
// };
