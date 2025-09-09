import { Link, NavLink } from "react-router-dom"
import HeaderMenu from "@/components/HeaderMenu/HeaderMenu"
import { CKBContext } from "@/providers/CKBProvider/CKBProvider"
import { useContext, useState } from "react"
import { LangContext } from "@/providers/LangProvider/LangProvider"
import { useParams } from "react-router-dom"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/Drawer"

function Header() {
    const { address, network } = useContext(CKBContext)
    const { lang } = useContext(LangContext)
    const { address: addressParams } = useParams()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <header className={"sticky w-full bg-white shadow h-[60px] top-0 z-20"}>
            <div className={"max-w-[--page-with] mx-auto h-[60px] flex items-center px-3 box-border justify-between"}>
                <div className="flex flex-row items-center">
                    <Drawer direction={"left"} open={isOpen} onOpenChange={setIsOpen}>
                        <DrawerTrigger>
                            <i className="md:hidden block uil-align-justify text-2xl mr-2" />
                        </DrawerTrigger>
                        <DrawerContent className="bg-white w-[60vw] h-[100vh] !top-0 !mt-0">
                            <div className="mb-4 px-3 grid grid-cols-1 gap-3">
                                <Link to="/">
                                    <img src="/images/logo.png" alt="" width={114} height={32} />
                                </Link>

                                {!!address && (
                                    <NavLink
                                        onClick={() => setIsOpen(false)}
                                        className="font-semibold pl-3"
                                        to={`/address/${address}`}
                                    >
                                        <i className=""></i> {lang["Profile"]}
                                    </NavLink>
                                )}
                                <NavLink onClick={() => setIsOpen(false)} className="font-semibold pl-3" to={`/market`}>
                                    {lang["Market"]}
                                </NavLink>
                                <NavLink onClick={() => setIsOpen(false)} className="font-semibold pl-3" to={`/apps`}>
                                    {lang["Apps"]}
                                </NavLink>
                                {
                                    network === "mainnet" && (
                                        <NavLink onClick={() => setIsOpen(false)} className="font-semibold pl-3" to={`/trade`}>
                                            {lang["Swap"]}
                                        </NavLink>
                                    )
                                }
                            </div>
                        </DrawerContent>
                    </Drawer>

                    <Link to="/">
                        <img src="/images/logo.png" alt="" width={114} height={32} />
                    </Link>

                    <div className="hidden sm:block">
                        {!!address && (
                            <NavLink
                                className={({ isActive }) => {
                                    return `whitespace-nowrap text-xs font-semibold ml-3 md:ml-10 md:text-sm ${isActive && address === addressParams ? "text-[#6CD7B2]" : ""
                                        }`
                                }}
                                to={`/address/${address}`}
                            >
                                {lang["Profile"]}
                            </NavLink>
                        )}

                        <NavLink
                            className={({ isActive }) => {
                                return `whitespace-nowrap text-xs font-semibold ml-3 md:ml-10 md:text-sm ${isActive ? "text-[#6CD7B2]" : ""
                                    }`
                            }}
                            to={`/market`}
                        >
                            {lang["Market"]}
                        </NavLink>
                        <NavLink
                            className={({ isActive }) => {
                                return `whitespace-nowrap text-xs font-semibold ml-3 md:ml-10 md:text-sm ${isActive ? "text-[#6CD7B2]" : ""
                                    }`
                            }}
                            to={`/apps`}
                        >
                            {lang["Apps"]}
                        </NavLink>
                        {
                            network === "mainnet" && (
                                <NavLink
                                    className={({ isActive }) => {
                                        return `whitespace-nowrap text-xs font-semibold ml-3 md:ml-10 md:text-sm ${isActive ? "text-[#6CD7B2]" : ""
                                            }`
                                    }}
                                    to={`/trade`}
                                >
                                    {lang["Swap"]}
                                </NavLink>
                            )
                        }

                    </div>
                </div>

                <HeaderMenu />
            </div>
        </header>
    )
}

export default Header
