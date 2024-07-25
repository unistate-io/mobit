import {useContext, useState} from "react"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import useLayer1Assets from "@/serves/useLayer1Assets"
import Button from "@/components/Form/Button/Button"
import Input from "@/components/Form/Input/Input"

export default function Test() {
    const {
        signer, // 没链接钱包是undefined
        config, // 网络配置信息
        network, // testnet/mainnet
        address, // ckb地址
        addresses // evm钱包存在多个ckb地址,都可以用作支付
    } = useContext(CKBContext) // ccc 的 api

    const [btcAddress, setBtcAddress] = useState('bc1qcw5t6p6shd244s3zwv0y2lrt6zpkuuqxmqvnfg')
    const [queryBtcAddress, setQueryBtcAddress] = useState<undefined | string>(undefined)


    const {dobs, btc, xudts, status} = useLayer1Assets(queryBtcAddress)


    return <div>

        <div className="w-[500px] mx-auto my-20">
            <Input type="text" value={btcAddress} onChange={e => {setBtcAddress(e.target.value)} }/>
            <Button className="mt-4" onClick={e => {setQueryBtcAddress(btcAddress)}}>点击查询</Button>
        </div>

        <div>
            <div>status:</div>
            <div>{status}</div>

            <div>dobs:</div>
            <div>{JSON.stringify(dobs)}</div>

            <div>btc:</div>
            <div>{JSON.stringify(btc)}</div>

            <div>xudts:</div>
            <div>{JSON.stringify(xudts)}</div>
        </div>
    </div>
}
