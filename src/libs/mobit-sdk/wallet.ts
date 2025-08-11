import { bitcoin, transactionToHex } from "@rgbpp-sdk/btc";
import { BtcAssetsApi } from "rgbpp";
import { AbstractWallet } from "./helper";

export async function signAndSendPsbt(
  psbt: bitcoin.Psbt,
  wallet: AbstractWallet,
  service: BtcAssetsApi,
): Promise<{
  txId: string;
  txHex: string;
  rawTxHex: string;
}> {
  console.debug("Starting PSBT signing process...");
  console.debug("PSBT before signing:", psbt.toHex());

  try {
    console.debug("test");
    const signPbst = bitcoin.Psbt.fromHex(await wallet.signPsbt(psbt.toHex()));
    console.debug("PSBT after signing:", signPbst.toBase64());

    const tx = signPbst.extractTransaction();
    const txHex = tx.toHex();
    console.debug("Extracted transaction hex:", txHex);

    console.debug("Sending transaction to service...");
    const { txid } = await service.sendBtcTransaction(txHex);
    console.debug("Transaction sent successfully. TXID:", txid);

    const rawTxHex = transactionToHex(tx, false);
    console.debug("Raw transaction hex (excluding witness):", rawTxHex);

    return {
      txHex,
      txId: txid,
      rawTxHex,
    };
  } catch (error) {
    console.error("Error during PSBT signing or transaction sending:", error);
    throw error;
  }
}
