"use client"
import { FaFolder } from "react-icons/fa";
import { SlOptionsVertical } from "react-icons/sl";

export default function FolderItem({ folder, currentPath, navigateTo }) {
    const folderNavPath = currentPath
        ? `${currentPath}/${folder.name}`
        : folder.name;

    return (
        <div
            className="w-full flex h-[4rem] header-btn rounded-sm p-0 mb-2 bg-[#1e1f20] cursor-pointer"
            onClick={() => navigateTo(folderNavPath)}  // ← just call navigateTo
        >
            {/* Icon */}
            <div className="w-[10%] sm:w-[8%] flex items-center justify-center h-full flex-none text-2xl text-yellow-400">
                <FaFolder />
            </div>

            <div className="w-[80%] sm:w-[47%] h-full flex-none pr-2 flex items-center overflow-hidden">
                <span className="truncate font-semibold">{folder.name}</span>
            </div>

            <div className="hidden sm:flex sm:w-[25%] flex-none" />
            <div className="hidden sm:flex sm:w-[15%] flex-none" />

            <div className="w-[10%] sm:w-[5%] flex items-center justify-center h-full flex-none">
                <button className="header-btn" onClick={(e) => e.stopPropagation()}>
                    <SlOptionsVertical/>
                </button>
            </div>
        </div>
    );
}