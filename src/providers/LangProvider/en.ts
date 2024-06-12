function slotLang(str: string) {
    return function (slots: any[]): string {
        let res = str
        slots.forEach(slot => {
            res = res.replace(/\{(\w+)\}/i, slot)
        })
        return res
    }
}

const langEN = {
    Connect: 'Connect',
    Profile: 'Profile',
    Market: 'Market',
    Apps: 'Apps',
    All: 'All',
    Tokens: 'Tokens',
    DOBs: 'DOBs',
    Activity: 'Activity',
    Assets: 'Assets',
    Balance: 'Balance',
    Actions: 'Actions',
    Receive: 'Receive',
    Send: 'Send',
    ViewAll: 'View All',
    ShowMoreRecords: 'Show More Records',
    Price: 'Price',
    MarketCap: 'Market Cap',
    Change24h: 'Change 24h',
    ViewTheProduct: 'View The Product',
    Transactions: 'Transactions',
}


export type LangConfig = typeof langEN
export default langEN
