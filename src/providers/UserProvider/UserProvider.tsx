import {createContext, useContext, useEffect, useState} from 'react'
import {defaultTheme, getTheme, UserTheme} from "@/providers/UserProvider/themes";
import {CKBContext} from "@/providers/CKBProvider/CKBProvider";

export interface UserContextType {
    address?: string
    theme: UserTheme
    isOwner?: boolean
}

export const UserContext = createContext<UserContextType>({
    address: undefined,
    theme: defaultTheme,
    isOwner: false
})

function UserProvider(props: { children: any, address: string }) {
    const {address: connectedAddress} = useContext(CKBContext)

    const [theme, setTheme] = useState<UserTheme>(defaultTheme)
    const [address, setAddress] = useState<undefined | string>(props.address)
    const [isOwner, setIsOwner] = useState(props.address === connectedAddress)


    useEffect(() => {
        setTheme(getTheme(props.address))
        setAddress(props.address);
    }, [props.address])

    useEffect(() => {
        if (!!connectedAddress) {
            setIsOwner(props.address === connectedAddress)
        } else {
            setIsOwner(false)
        }
    }, [connectedAddress, props.address])

    return (<UserContext.Provider value={{address, theme, isOwner}}
    >{props.children}
    </UserContext.Provider>)
}

export default UserProvider