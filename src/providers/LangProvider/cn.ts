import {LangConfig} from './en'

function slotLang(str: string) {
    return function (slots: any[]): string {
        let res = str
        slots.forEach(slot => {
            res = res.replace(/\{(\w+)\}/i, slot)
        })
        return res
    }
}

const langCN: LangConfig = {
    Connect: '连接钱包',
    Profile: '个人',
    Market: '行情',
    Apps: '应用',
    All: '全部',
    Tokens: '代币',
    DOBs: 'DOBs',
    Activity: '活动',
    Assets: '资产',
    Balance: '余额',
    Actions: '操作',
    Receive: '接收',
    Send: '发送',
    ViewAll: '查看全部',
    ShowMoreRecords: '显示更多记录',
    Price: '价格',
    MarketCap: '市值',
    Change24h: '24小时涨跌',
    ViewTheProduct: '查看应用',
    Transactions: '交易',
    Merge: '合并',
    Burn: '销毁',
    Cancel: '取消',
    Input: '输入',
    Output: '输出',
    Leap: '跨链',
    Select_An_UTXO_To_Leap: '选择一个UTXO进行跨链',
    Leap_To: '跨链至',
    Bitcoin_Address: '比特币地址',
    Amount: '数量',
    Leap_Amount: '跨链数量',
    Fee_Rate: '费率',
    Capacity_Fee: '容量费',
    Leap_l2_to_l1: '从L2跨链至L1',
    It_Is_Recommended_To_Use_546_Satoshi_UTXO_To_Avoid_Being_Accidentally_Spent_And_wasted: '建议使用546聪(0.00000546 BTC)的UTXO以避免被意外花费和浪费',
    Create_A_New_UTXO: '创建一个新的UTXO',
    Create_UTXO: '创建UTXO',
    Create_An_UTXO_To_Leap_Assets: '创建一个UTXO用来资产跨链',
    Network_Fee: '网络费',
    Unconfirmed: '未确认',
    Leap_l1_to_l2: '从L1跨链至L2',
    'Transfer': '发送',
    From: '从',
    'Send to': '发送至',
    Asset: '资产',
    'Sign Transaction': '签名交易',
    'Send Token': '发送代币',
    'From Address': '从地址',
    'BTC Fee Rate': 'BTC费率',
    'To Address':'到地址',
    'Continue': '继续',
    'fee rate': '费率',
    'Recipient address': '接收地址',
    'Transfer amount': '发送数量',
    'Transaction fee': '交易费',
    'Transaction Sent !': '交易已发送！',
    'The transaction is sent and will be confirmed later': '交易已发送，稍后将会被确认',
    'To': '至',
    'Time': '时间',
    'Total amount': '总数量',
    'Tx Hash': '交易哈希',
    'View on Explorer': '在浏览器中查看',
    'Done': '完成',
    'Next': '下一步',
    'Once the transaction is confirmed,': '一旦交易被确认，',
    'you can use this UTXO to leap assets.': '你可以使用这个UTXO来跨链资产。',
    'Leap amount': '跨链数量',
    'Leap to': '跨链至',
    'The leap action will be completed after this transaction has been confirmed by more than': '这个跨链操作将会在这个交易被超过',
    'blocks': '个区块确认后完成',
    'Connected': '已连接',
    'Not Wallet founded': '未找到钱包',
    'Network': '网络',
    'Disconnect': '断开连接',
    'OK': '确定',
    'Scan to Transfer': '扫码转账',
    'Sell': '卖出',
    'Buy': '买入',
    'Connect Wallet': '连接钱包',
    'Max slippage': '最大滑点',
    'Fee': '费用',
    'Select A Wallet': '选择一个钱包',
    'Burn UDT': '销毁UDT',
    'Effortlessly and securely transfer assets between Bitcoin and CKB': '轻松安全地在比特币和CKB之间转移资产',
    'Enjoying a seamless cross-chain experience with RGB++ Leap functionality!': '通过RGB++ Leap功能享受无缝的跨链体验！',
    'Select...': '选择币种',
    'View More': '查看更多',
    'No assets found': '没有找到资产',
    'No transaction found': '没有找到交易',
    'items': '条',
    'Information': '信息',
    'Owner': '所有者',
    'Token ID': 'Token ID',
    'Cluster': '集群',
    'Traits': '特征',
    'No data to show': '没有数据',
    'Chain': '链',
    'Type': '类型',
    'Manager': '管理员',
    'Create At': '创建时间',
    'Expired At': '过期时间',
    'Records': '记录',
    'We value your feedback! Share any issues on Github or Telegram.': '我们重视您的反馈！请在Github或Telegram上分享任何问题。',
    'Swap tokens via UTXO Swap': '通过UTXO Swap交换代币',
    'Send CKB to Others': '向他人发送CKB',
    'Receive assets from others': '接收他人的资产',
    'Leap tokens to CKB chain': '跨链代币到CKB链',
    'Send tokens to others': '向他人发送代币',
    'Leap tokens to BTC chain': '跨链代币到BTC链',
    'Use multiple cells to merge into a single cell and release capacity': '使用多个Cell合并为一个Cell并释放容量',
    'Burn XUDT and release capacity': '销毁XUDT并释放容量',
    'CKB/BTC/EVM address...': 'CKB/BTC/EVM地址...',
    'Net Worth': '净值',
}


export default langCN
