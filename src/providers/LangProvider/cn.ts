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
}


export default langCN
