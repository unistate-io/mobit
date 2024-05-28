import { LangConfig } from './en'

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
  Apps: 'Apps',
}


export default langCN
