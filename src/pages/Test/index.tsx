import { useContext, useState, useEffect } from "react";
import { CKBContext } from "@/providers/CKBProvider/CKBProvider";
import useLayer1Assets from "@/serves/useLayer1Assets";
import Button from "@/components/Form/Button/Button";
import Input from "@/components/Form/Input/Input";
import { BtcHelper, CkbHelper, transferCombined } from "mobit-sdk";

export default function Test() {
  const {
    signer, // 没链接钱包是undefined
    config, // 网络配置信息
    network, // testnet/mainnet
    address, // ckb地址
    addresses // evm钱包存在多个ckb地址,都可以用作支付
  } = useContext(CKBContext); // ccc 的 api

  const [btcAddress, setBtcAddress] = useState('bc1qcw5t6p6shd244s3zwv0y2lrt6zpkuuqxmqvnfg');
  const [queryBtcAddress, setQueryBtcAddress] = useState<undefined | string>(undefined);
  const [toBtcAddress, setToBtcAddress] = useState('bc1qcw5t6p6shd244s3zwv0y2lrt6zpkuuqxmqvnfg');
  const [xudtTypeArgs, setXudtTypeArgs] = useState('0x0a5c9645b871a28af6d8040ff43a8ea62a6f12a4c131c0bbdc3a20a0e46ff292');
  const [transferAmount, setTransferAmount] = useState(BigInt(100));
  const [unisatInstalled, setUnisatInstalled] = useState(false);

  const { dobs, btc, xudts, status } = useLayer1Assets(queryBtcAddress);

  useEffect(() => {
    async function checkUnisat() {
      let unisat = (window as any).unisat;
      for (let i = 1; i < 10 && !unisat; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100 * i));
        unisat = (window as any).unisat;
      }
      setUnisatInstalled(!!unisat);
    }
    checkUnisat();
  }, []);

  if (!unisatInstalled) {
    return (
      <div className="w-[500px] mx-auto my-20">
        <div>
          <Button
            onClick={() => {
              window.location.href = "https://unisat.io";
            }}
          >
            Install Unisat Wallet
          </Button>
        </div>
      </div>
    );
  }

  const unisat = (window as any).unisat;
  const btcHelper = new BtcHelper(unisat, 0);
  const ckbHelper = new CkbHelper(true);
  return (
    <div className="w-[500px] mx-auto my-20">
      <div>
        <label>BTC Address</label>
        <Input
          type="text"
          value={btcAddress}
          onChange={e => setBtcAddress(e.target.value)}
        />
      </div>
      <Button className="mt-4" onClick={() => setQueryBtcAddress(btcAddress)}>
        点击查询
      </Button>
      <div>
        <label>To BTC Address</label>
        <Input
          type="text"
          value={toBtcAddress}
          onChange={e => setToBtcAddress(e.target.value)}
        />
      </div>
      <div>
        <label>XUDT Type Args</label>
        <Input
          type="text"
          value={xudtTypeArgs}
          onChange={e => setXudtTypeArgs(e.target.value)}
        />
      </div>
      <div>
        <label>Transfer Amount</label>
        <Input
          type="text"
          value={transferAmount.toString(10)}
          onChange={e => setTransferAmount(BigInt(e.target.value))}
        />
      </div>
      <Button
        className="mt-4"
        onClick={() => {
          transferCombined({
            toBtcAddress,
            xudtTypeArgs,
            transferAmount,
            collector: ckbHelper.collector,
            isMainnet: ckbHelper.isMainnet,
            fromBtcAccount: btcAddress,
            btcService: btcHelper.btcService,
            btcDataSource: btcHelper.btcDataSource,
            unisat: btcHelper.unisat
          });
        }}
      >
        点击测试
      </Button>
      <div className="mt-8">
        <div>Status: {status}</div>
        <div>DOBS: {JSON.stringify(dobs)}</div>
        <div>BTC: {JSON.stringify(btc)}</div>
        <div>XUDTS: {JSON.stringify(xudts)}</div>
      </div>
    </div>
  );
}
