"use client"
import {SlOptionsVertical} from "react-icons/sl";
import {CiImageOn} from "react-icons/ci";
import {formatFileSize} from "@/utils/formatFileSize";
import {useUI} from "@/context/UIContext";
import FileOptionsMenu from "@/components/menu/FileOptionMenu";

export default function FilesListItem({file}) {
    const {openModal} = useUI();

    return (
        <div
        className="w-full flex h-[4rem] header-btn rounded-sm p-0 mb-2 bg-[#1e1f20]"
        onClick={() => {
            let type = "other"
            let ext = file.extension;
            if (ext === "mp4") {
                type = "video";
            }
            if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
            type = "image";
            }

            console.log("file extension:", ext)
            // Build relative path from folderPath + name instead of using
            // file.path because of my safe path check on the backend
            const relativePath = file.folderPath
                ? `${file.folderPath}/${file.name}`
                : file.name;

            openModal(type, {
                url: relativePath,   // fitness/abs.mp4
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
        <FileOptionsMenu file={file} />

    </div>);
}