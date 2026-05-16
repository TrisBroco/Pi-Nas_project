"use client"
import { useEffect } from "react";
import { useTrash } from "@/components/hooks/useTrash";
import TrashItem from "@/components/views/TrashItem";

export default function TrashView() {
    const { files, loading, fetchTrash, restore, permanentDelete } = useTrash();

    useEffect(() => { fetchTrash(); }, []);

    return (
        <div className="flex-grow flex justify-start h-[90%] gap-2">
            <div className="rounded-2xl bg-[#131314] border-black w-full h-full flex flex-col">
                <div className="relative w-full flex min-h-[55px] text-[1.25rem] border-b border-gray-800">
                    <div className="w-[50%] flex items-center h-full sm:w-[45%] flex-none ps-4 text-gray-200">Trash</div>
                    <div className="hidden items-center h-full sm:flex sm:w-[25%] flex-none text-gray-200 text-sm">Deleted on</div>
                    <div className="hidden items-center h-full sm:flex sm:w-[10%] flex-none text-gray-200 text-sm">Size</div>
                </div>
                <div className="flex-grow overflow-y-auto pl-2 pr-2 pt-2">
                    {loading && <p className="text-gray-400 px-4">Loading...</p>}
                    {!loading && files.length === 0 && <p className="text-gray-300 px-4">Trash is empty.</p>}
                    {files.map((file) => (
                        <TrashItem
                            key={file.id}
                            file={file}
                            onRestore={restore}
                            onDelete={permanentDelete}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}