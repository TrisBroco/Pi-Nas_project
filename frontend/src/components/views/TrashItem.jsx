"use client"
import { FiRotateCcw, FiTrash2 } from "react-icons/fi";
import { CiImageOn } from "react-icons/ci";
import { formatFileSize } from "@/utils/formatFileSize";

export default function TrashItem({ file, onRestore, onDelete }) {
    return (
        <div className="w-full flex h-[4rem] rounded-sm p-0 mb-2 bg-[#1e1f20] opacity-70">
            <div className="w-[10%] sm:w-[8%] flex items-center justify-center h-full flex-none text-2xl">
                <CiImageOn />
            </div>
            <div className="w-[40%] sm:w-[37%] h-full flex-none pr-2 flex flex-col justify-center overflow-hidden">
                <span className="truncate text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-400">{file.folderPath || "root"}</span>
            </div>
            <div className="hidden items-center h-full sm:flex sm:w-[25%] flex-none text-gray-300 text-sm">
                {new Date(file.dateModified).toLocaleDateString()}
            </div>
            <div className="hidden items-center h-full sm:flex sm:w-[10%] flex-none text-gray-300 text-sm">
                {formatFileSize(file.size)}
            </div>
            <div className="w-[50%] sm:w-[20%] flex items-center justify-end gap-1 h-full flex-none pr-2">
                <button
                    onClick={() => onRestore(file.id)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400"
                >
                    <FiRotateCcw size={12} /> Restore
                </button>
                <button
                    onClick={() => onDelete(file.id, file.name)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/40 text-red-400"
                >
                    <FiTrash2 size={12} /> Delete
                </button>
            </div>
        </div>
    );
}