import Avatar from "@/components/Avatar/Avatar";
import {getTheme} from "@/providers/UserProvider/themes";
import {useContext, useEffect} from "react";
import {CKBContext} from "@/providers/CKBProvider/CKBProvider";
import {Link} from "react-router-dom";
import Select from "@/components/Select/Select";
import {LangContext} from "@/providers/LangProvider/LangProvider";
import {useNavigate} from "react-router-dom";

export default function HeaderMenu() {
    const {open, address} = useContext(CKBContext);
    const {lang, langType, switchLang} = useContext(LangContext)
    const navigate = useNavigate()

    useEffect(() => {
        if (!!address) {
            navigate(`address/${address}`)
        }
    }, [address])

    return <div className="flex flex-row flex-nowrap items-center">
        <Link to={'search'} className="text-sm"><i className="uil-search"/></Link>
        <i className="w-[1px] h-[14px] bg-black mx-3 scale-x-50 hidden sm:block "/>
        <div className="hidden sm:block text-xs">
            <Select
                onValueChange={(value) => {
                    switchLang(value as any)
                }}
                className="text-xs"
                value={langType}
                hideDropIcon={true}
                options={[
                    {label: 'EN', id: 'en'},
                    {label: 'CN', id: 'cn'},
                ]}
            />
        </div>
        <i className="w-[1px] h-[14px] bg-black mx-3 scale-x-50"/>
        {
            address ?
                <Link to={`/address/${address}`} className="flex flex-row items-center">
                    <Avatar size={18} colors={getTheme(address).colors} name={address}/>
                </Link> :
                <div className="text-xs cursor-pointer hover:text-[#6CD7B2]"
                     onClick={open}
                ><i className="uil-wallet text-sm mr-1"/>{lang['Connect']}</div>
        }
    </div>
}
