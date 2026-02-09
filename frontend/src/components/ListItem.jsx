"use client"
import {SlOptionsVertical} from "react-icons/sl";
import {CiImageOn} from "react-icons/ci";
import {formatFileSize} from "@/utils/formatFileSize";
import {useUI} from "@/context/UIContext";

export default function ListItem({file}) {
    const downloadUrl = `/api/download?path=${encodeURIComponent(file.path)}`;
    const {openModal} = useUI();

    return (<div
        className="w-full flex h-[4rem] header-btn rounded-sm p-0 mb-2 bg-[#1e1f20]"
        onClick={() => {
            let type = "other"
            if (file.extension === "mp4") {
                type = "video";
            }

            console.log("file extension:", file.extension)
            openModal(type, {
                url: file.path,
                name: file.name
            });
        }}
    >
        <div className="w-[10%] sm:w-[8%] flex items-center justify-center h-full flex-none  text-2xl"><CiImageOn/>
        </div>

        {/*File Name column*/}
        <div className="w-[80%] sm:w-[47%] h-full flex-none pr-2 flex items-center overflow-hidden">
                <span className="truncate">
                    {file.name}
                </span>
        </div>

        {/*dateModified column | Hidden on mobile*/}
        <div className="hidden items-center h-full sm:flex sm:w-[25%] flex-none ">{file.dateModified}</div>

        {/*size info Column  | Hidden on mobile*/}
        <div className="hidden items-center h-full sm:flex sm:w-[15%] flex-none ">{formatFileSize(file.size)}</div>

        {/*3dot Option menu */}
        <div className=" w-[10%] sm:w-[5%] flex items-center justify-center h-full flex-none">
            <button className="header-btn">
                <SlOptionsVertical/>
            </button>
        </div>

        {/*/!* Download *!/*/}
        {/*<a*/}
        {/*    href={downloadUrl}*/}
        {/*    className="ml-auto text-indigo-500 hover:underline"*/}
        {/*>*/}
        {/*    Download*/}
        {/*</a>*/}

    </div>);
}