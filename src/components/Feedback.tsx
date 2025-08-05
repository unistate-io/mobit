import {LangContext} from "@/providers/LangProvider/LangProvider"
import {useContext} from "react"
import BlockHeightStatus from "./BlockHeightStatus"

export default function Feedback() {
    const {lang} = useContext(LangContext)
    return (
        <div className="sm:flex-row flex-col p-4 rounded-lg bg-[#F3FBFF] flex items-center max-w-[--page-with] my-5 mx-auto justify-between">
            <div className="text-sm text-center sm:text-left mb-3 sm:mb-0">
                {lang["We value your feedback! Share any issues on Github or Telegram."]}
            </div>
            <div className="flex flex-row items-center space-x-4">
                {/* Block Height Status */}
                <BlockHeightStatus />

                {/* Social Links */}
                <div className="flex flex-row items-center space-x-3">
                    <a
                        href="https://github.com/unistate-io/mobit/issues"
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <svg
                            className="icon"
                            viewBox="0 0 1024 1024"
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            p-id="1451"
                            width="24"
                            height="24"
                        >
                            <path
                                d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9 23.5 23.2 38.1 55.4 38.1 91v112.5c0.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z"
                                p-id="1452"
                            ></path>
                        </svg>
                    </a>
                    <a href="https://t.me/mobit_app" className="text-gray-600 hover:text-gray-800 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M20.5 10C20.5 15.5228 16.0228 20 10.5 20C4.97715 20 0.5 15.5228 0.5 10C0.5 4.47715 4.97715 0 10.5 0C16.0228 0 20.5 4.47715 20.5 10ZM10.8586 7.38246C9.88593 7.78702 7.94201 8.62435 5.0268 9.89446C4.55342 10.0827 4.30544 10.2669 4.28287 10.4469C4.24472 10.7513 4.62582 10.8711 5.14479 11.0343C5.21538 11.0565 5.28852 11.0795 5.36351 11.1039C5.87409 11.2698 6.56092 11.464 6.91797 11.4717C7.24185 11.4787 7.60333 11.3452 8.00243 11.0711C10.7262 9.23252 12.1322 8.3032 12.2205 8.28316C12.2828 8.26903 12.3691 8.25126 12.4275 8.30323C12.486 8.3552 12.4803 8.45362 12.4741 8.48003C12.4363 8.64097 10.9403 10.0318 10.1662 10.7515C9.92481 10.9759 9.75362 11.135 9.71863 11.1714C9.64023 11.2528 9.56033 11.3298 9.48354 11.4039C9.0092 11.8611 8.65349 12.204 9.50324 12.764C9.91159 13.0331 10.2384 13.2556 10.5644 13.4776C10.9204 13.7201 11.2755 13.9619 11.7349 14.2631C11.852 14.3398 11.9637 14.4195 12.0726 14.4971C12.487 14.7925 12.8592 15.0579 13.319 15.0156C13.5863 14.991 13.8623 14.7397 14.0025 13.9903C14.3337 12.2193 14.9849 8.38207 15.1354 6.80083C15.1486 6.6623 15.132 6.485 15.1187 6.40717C15.1054 6.32934 15.0775 6.21844 14.9764 6.13635C14.8566 6.03913 14.6716 6.01863 14.5889 6.02009C14.2127 6.02672 13.6357 6.22737 10.8586 7.38246Z"
                                fill="#25A1DF"
                            />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    )
}
