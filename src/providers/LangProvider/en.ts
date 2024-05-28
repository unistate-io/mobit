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
}


export type LangConfig = typeof langEN
export default langEN
