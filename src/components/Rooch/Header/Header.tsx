import { Link, NavLink } from "react-router-dom"
import HeaderMenu from "@/components/Rooch/HeaderMenu/HeaderMenu"
import {useContext, useState} from "react"
import { LangContext } from "@/providers/LangProvider/LangProvider"
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/Drawer"
import {RoochContext} from "@/providers/RoochProvider/RoochProvider";

function Header() {
    const { lang } = useContext(LangContext)
    const [isOpen, setIsOpen] = useState(false)
    const { roochAddress } = useContext(RoochContext)

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
                               <Link to="/rooch">
                                   <img src="/images/logo.png" alt="" width={114} height={32} />
                               </Link>

                               <NavLink
                                   onClick={() => setIsOpen(false)}
                                   className='font-semibold pl-3'
                                   to={`/rooch/address/${roochAddress}`}>
                                   <i className=""></i> {lang["Profile"]}
                               </NavLink>

                               <NavLink
                                   onClick={() => setIsOpen(false)}
                                   className='font-semibold pl-3'
                                   to={`/rooch/market`}>
                                   {lang["Market"]}
                               </NavLink>
                           </div>
                        </DrawerContent>
                    </Drawer>

                    <Link to="/rooch">
                        <img src="/images/logo.png" alt="" width={114} height={32} />
                    </Link>

                    <div className="hidden sm:block">
                        <NavLink
                            className={({ isActive }) => {
                                return `whitespace-nowrap text-xs font-semibold ml-3 md:ml-10 md:text-sm ${isActive  ? "text-[#6CD7B2]" : ""
                                }`
                            }}
                            to={`/rooch/address/${roochAddress}`}
                        >
                            {lang["Profile"]}
                        </NavLink>

                        <NavLink
                            className={({ isActive }) => {
                                return `whitespace-nowrap text-xs font-semibold ml-3 md:ml-10 md:text-sm ${isActive ? "text-[#6CD7B2]" : ""
                                }`
                            }}
                            to={`/rooch/market`}
                        >
                            {lang["Market"]}
                        </NavLink>
                    </div>
                </div>
                <HeaderMenu />
            </div>
        </header>
    )
}

export default Header
