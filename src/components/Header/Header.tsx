import {Link, NavLink} from "react-router-dom";
import HeaderMenu from "@/components/HeaderMenu/HeaderMenu";
import {CKBContext} from "@/providers/CKBProvider/CKBProvider";
import {useContext} from "react";
import {LangContext} from "@/providers/LangProvider/LangProvider";
import {useParams} from "react-router-dom";

function Header() {
    const {address} = useContext(CKBContext);
    const {lang} = useContext(LangContext)
    const {address : addressParams} = useParams()


    return <header className={'sticky w-full bg-white shadow h-[60px] top-0'}>
        <div className={'max-w-[1044px] mx-auto h-[60px] flex items-center px-3 box-border justify-between'}>
            <div className="flex flex-row items-center">
                <Link to="/">
                    <svg xmlns="http://www.w3.org/2000/svg"
                         width={105}
                         height={31}
                         viewBox="0 0 105 31"
                         fill="none"
                    >
                        <path
                            d="M11.5244 23.9025V6.82935H12.8089L20.6813 15.2217L28.6015 6.82935H29.882L29.9458 23.9025H26.0406V15.6077L20.6813 20.9147L15.5833 15.6077V23.9025H11.5244Z"
                            fill="#272928"
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M41.4062 10.5771C38.7614 10.5771 36.6174 12.7211 36.6174 15.3659C36.6174 18.0107 38.7614 20.1547 41.4062 20.1547C44.051 20.1547 46.195 18.0107 46.195 15.3659C46.195 12.7211 44.051 10.5771 41.4062 10.5771ZM32.8696 15.3659C32.8696 10.6513 36.6916 6.82935 41.4062 6.82935C46.1208 6.82935 49.9428 10.6513 49.9428 15.3659C49.9428 20.0806 46.1208 23.9025 41.4062 23.9025C36.6916 23.9025 32.8696 20.0806 32.8696 15.3659Z"
                            fill="#272928"
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M52.9307 6.82935H63.1746C66.0033 6.82935 68.2965 9.12252 68.2965 11.9513C68.2965 14.7801 66.0033 17.0732 63.1746 17.0732H52.9307V6.82935ZM56.3453 10.244V13.6586H63.1746C64.1175 13.6586 64.8819 12.8942 64.8819 11.9513C64.8819 11.0084 64.1175 10.244 63.1746 10.244H56.3453Z"
                            fill="#272928"
                        />
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M52.9307 13.6586H64.2416C66.9525 13.6586 69.1502 15.8562 69.1502 18.5672C69.1502 21.2781 66.9526 23.4757 64.2416 23.4757H52.9307V13.6586ZM56.3453 17.0732V20.0611H64.2416C65.0667 20.0611 65.7355 19.3922 65.7355 18.5672C65.7355 17.7421 65.0667 17.0732 64.2416 17.0732H56.3453Z"
                            fill="#272928"
                        />
                        <rect
                            x="72.1382"
                            y="13.6584"
                            width="3.84146"
                            height="10.2439"
                            fill="#272928"
                        />
                        <path
                            d="M93.4794 6.82935V10.6708L79.394 10.6708L79.394 6.82935L93.4794 6.82935Z"
                            fill="#272928"
                        />
                        <path d="M84.516 9.81715H88.3575V23.9025H84.516V9.81715Z" fill="#272928"/>
                        <circle cx="74.0589" cy="10.0306" r="1.92073" fill="#38E699"/>
                    </svg>
                </Link>

                {!!address &&
                    <NavLink className={({isActive}) => {
                        return `whitespace-nowrap text-xs font-semibold ml-3 md:ml-10 md:text-sm ${isActive && address === addressParams ? 'text-[#6CD7B2]' : ''}`
                    }}
                             to={`/address/${address}`}>
                        {lang['Profile']}
                    </NavLink>
                }

                <NavLink className={({isActive}) => {
                    return `whitespace-nowrap text-xs font-semibold ml-3 md:ml-10 md:text-sm ${isActive ? 'text-[#6CD7B2]' : ''}`
                }} to={`/market`}>{lang['Market']}</NavLink>
                <NavLink className={({isActive}) => {
                    return `whitespace-nowrap text-xs font-semibold ml-3 md:ml-10 md:text-sm ${isActive ? 'text-[#6CD7B2]' : ''}`
                }} to={`/apps`}>{lang['Apps']}</NavLink>
            </div>

            <HeaderMenu/>
        </div>
    </header>
}

export default Header
