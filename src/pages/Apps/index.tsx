import useApps from "@/serves/useApps"
import {Link} from "react-router-dom"

export default function AppsPage() {
    const {data} = useApps()

    return <div className="max-w-[1044px] mx-auto mt-4 md:mt-10">
       <div className="font-semibold text-2xl mb:4 md:mb-9 px-3 ">CKB Apps</div>
        <div className="flex flex-row flex-wrap w-full">
           {
               data.map((item, index) => {
                   return <div className="basis-full sm:basis-1/2 md:basis-1/3 px-3 pb-3"  key={index}>
                       <Link to={item.url} target="_blank" className="shadow p-4 md:p-6 rounded-xl block">
                           <div className="flex flex-row items-center">
                               <div className="w-16 h-16 rounded border border-[#F1F1F1] shrink-0">
                                   <img className="w-full h-full object-cover" src={item.logo} alt="" />
                               </div>
                               <div className="ml-6 text-xl font-semibold overflow-hidden line-clamp-2 line-clamp-ellipsis">{item.name}</div>
                           </div>
                           <div className="my-2 overflow-hidden line-clamp-2 line-clamp-ellipsis text-xs text-gray-400">{item.description}</div>
                           <div className="hover:bg-gray-200 font-semibold h-10 text-sm flex flex-row justify-center items-center rounded-lg bg-gray-100">
                               View the product
                           </div>
                       </Link>
                   </div>
               })
           }
       </div>
    </div>
}
