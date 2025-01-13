import en, { LangConfig } from "./en"
import zh from "./cn"
import { ReactNode, useState, createContext} from "react";

export enum LangType {
    zh='zh',
    en='en'
}

export const LangContext  = createContext({
    langType: 'en',
    switchLang: (type: LangType):void => {},
    lang: en
})


export interface LangProviderProps {
    children? : ReactNode
}

function available(value: string): boolean {
    return Object.values(LangType).includes(value as LangType)
}

function LangProvider (props: LangProviderProps) {
    const langPackage = {
        en,
        zh,
    }

    const historyLang = window.localStorage.getItem('lang') as LangType
    const systemLang = navigator.language.split('-')[0] as LangType || ''
    const [langType, setLangType] = useState(available(historyLang)
        ? historyLang
        : (available(systemLang)
            ? systemLang
            : LangType.en))
    const [lang, setLang] = useState(() => {
        return langPackage[langType] as LangConfig
    })

    const switchLang = (langType: LangType) => {
        if (!available(langType)) {
            return
        }

        setLangType(langType)
        setLang(langPackage[langType])
        window.localStorage.setItem('lang', langType)
    }


    return (
        <LangContext.Provider value={{ langType, lang, switchLang }}>
            { props.children }
        </LangContext.Provider>
    )
}

export default LangProvider
