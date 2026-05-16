"use client";
import { useState } from "react";
import { FaFolder } from "react-icons/fa";
import { useUI } from "@/context/UIContext";

export default function NewFolderView({ currentPath, navigateTo }) {
    const [folderName, setFolderName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { closeModal } = useUI();

    const handleCreate = async () => {
        if (!folderName.trim()) {
            setError("Please enter a folder name.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/folder/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    folderName: folderName.trim(),
                    currentPath: currentPath ?? "",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Failed to create folder");
                return;
            }

            // Refresh the current folder view to show the new folder
            navigateTo(currentPath ?? "");
            closeModal();

        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
            <div className="text-yellow-400 text-6xl">
                <FaFolder />
            </div>

            <p className="text-gray-500 text-sm">
                Creating in: <span className="text-gray-300">{currentPath || "Root"}</span>
            </p>

            <input
                type="text"
                placeholder="Folder name"
                value={folderName}
                onChange={(e) => {
                    setFolderName(e.target.value);
                    setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
                className="w-full max-w-sm bg-[#1e1f20] border border-gray-600 rounded-lg
                           px-4 py-2 text-white outline-none focus:border-yellow-600
                           placeholder:text-gray-600"
            />

            {error && (
                <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3">
                <button
                    onClick={closeModal}
                    className="px-6 py-2 rounded-lg border border-gray-600
                               text-gray-400 hover:text-white hover:border-gray-400"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700
                               text-white font-semibold disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Create Folder"}
                </button>
            </div>
        </div>
    );
}