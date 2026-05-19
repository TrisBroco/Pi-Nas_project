"use client"
import { useEffect, useRef, useState } from "react";
import { SlOptionsVertical } from "react-icons/sl";
import { FiDownload, FiTrash2, FiEdit2 } from "react-icons/fi";

export default function FileOptionsMenu({ file }) {
    const [open, setOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [newName, setNewName] = useState(file.name);
    const menuRef = useRef(null);

    const relativePath = file.folderPath
        ? `${file.folderPath}/${file.name}`
        : file.name;

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
                setRenaming(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDownload = () => {
        setOpen(false);
        // Browser handles the download natively — no memory lockup
        const a = document.createElement("a");
        a.href = `/api/download?filename=${encodeURIComponent(relativePath)}`;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDelete = async () => {
        setOpen(false);
        if (!confirm(`Delete "${file.name}"?`)) return;

        const res = await fetch(`/api/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: file.id,
                filename: file.name,
                folderPath: file.folderPath ?? "",
            }),
        });

        if (res.ok) {
            // Refresh the file list without full page reload
            window.dispatchEvent(new CustomEvent("file-deleted"));
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error ?? "Delete failed");
        }
    };

    const handleRename = async () => {
        if (!newName || newName === file.name) {
            setRenaming(false);
            return;
        }
        // Rename endpoint — add this to backend later
        alert("Rename coming soon — backend endpoint needed");
        setRenaming(false);
        setOpen(false);
    };

    return (
        <div
            ref={menuRef}
            className="relative w-[10%] sm:w-[5%] flex items-center justify-center h-full flex-none"
            onClick={(e) => e.stopPropagation()} // prevent row click
        >
            <button
                className="header-btn"
                onClick={() => setOpen(prev => !prev)}
            >
                <SlOptionsVertical />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-[#2a2b2c] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">

                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-yellow-600/30"
                    >
                        <FiDownload /> Download
                    </button>

                    {/* Rename */}
                    {renaming ? (
                        <div className="px-3 py-2 flex flex-col gap-1">
                            <input
                                className="text-sm bg-[#1e1f20] border border-gray-600 rounded px-2 py-1 text-white w-full outline-none"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                                autoFocus
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={handleRename}
                                    className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => { setRenaming(false); setNewName(file.name); }}
                                    className="text-xs text-gray-400 px-2 py-0.5 rounded hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setRenaming(true)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-yellow-600/30"
                        >
                            <FiEdit2 /> Rename
                        </button>
                    )}

                    {/* Delete */}
                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-600/20"
                    >
                        <FiTrash2 /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}