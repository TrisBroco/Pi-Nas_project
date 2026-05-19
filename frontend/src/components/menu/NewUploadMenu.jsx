"use client";
import { useEffect, useRef, useState } from "react";
import { MdCreateNewFolder } from "react-icons/md";
import { FiUpload } from "react-icons/fi";
import { FaFolderPlus } from "react-icons/fa";
import { useUI } from "@/context/UIContext";

export default function NewUploadMenu({ currentPath, onClose }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const { openModal } = useUI();

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen(prev => !prev)}
                className="w-[200px] text-white menu-btn flex gap-3 p-2"
            >
                <MdCreateNewFolder className="text-2xl" />
                New
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-[#2a2b2c]
                                border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">

                    {/* Upload */}
                    <button
                        onClick={() => {
                            setOpen(false);
                            openModal("upload");
                            onClose?.();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm
                                   text-white hover:bg-yellow-600/20"
                    >
                        <FiUpload className="text-yellow-400" />
                        Upload Files
                    </button>

                    {/* New Folder */}
                    <button
                        onClick={() => {
                            setOpen(false);
                            openModal("newFolder"," ", { currentPath });
                            onClose?.();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm
                                   text-white hover:bg-yellow-600/20"
                    >
                        <FaFolderPlus className="text-yellow-400" />
                        New Folder
                    </button>
                </div>
            )}
        </div>
    );
}