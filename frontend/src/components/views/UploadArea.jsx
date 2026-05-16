"use client";

import { useState, useRef } from "react";
import { useUI } from "@/context/UIContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function UploadArea({ currentFolder, navigateTo, refreshStorage }) {
    const [files, setFiles] = useState([]);
    const {closeModal} = useUI();
    const [uploading, setUploading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    // Per-file progress: { "file1.png": 36, "file2.pdf": 90 }
    const [progressMap, setProgressMap] = useState({});
    const dropRef = useRef(null);


    // Handle drag-over styling
    const handleDragOver = (e) => {
        e.preventDefault();
        dropRef.current.classList.add("border-blue-400");
    };

    const handleDragLeave = () => {
        dropRef.current.classList.remove("border-blue-400");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        dropRef.current.classList.remove("border-blue-400");
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prev) => [...prev, ...droppedFiles]);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setProgressMap({});

        for (const file of files) {
            try {
                await uploadSingleFile(file);
            } catch (err) {
                console.error("Error uploading", file.name, err);
            }
        }

        setUploading(false);
        setFiles([]);
        setProgressMap({})
        //used to refresh the current folder instead of refreshing
        // the entire site.
        navigateTo(currentFolder);
        refreshStorage?.();
        closeModal?.();
    };

    const uploadSingleFile = (file) => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);

            const xhr = new XMLHttpRequest();
            xhr.open(
                "POST",
                `${BACKEND_URL}/api/upload?folder=${encodeURIComponent(currentFolder)}`
            );

            // CRITICAL: This allows the browser to send your session cookies
            xhr.withCredentials = true;

            // Track progress for this file
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    setProgressMap((prev) => ({
                        ...prev,
                        [file.name]: percent,
                    }));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setProgressMap((prev) => ({
                        ...prev,
                        [file.name]: 100,
                    }));
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    // If you get a 401 here, the session expired during the upload
                    reject(`Upload failed: ${xhr.status} ${xhr.statusText}`);
                }
            };

            xhr.onerror = () => reject("Network error or CORS issue");
            xhr.send(formData);
        });
    };

    return (
        <div className="flex flex-col flex-grow h-full gap-y-4">
            {/* Drag & Drop Zone */}
            <label
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-400 p-10 rounded-lg text-center cursor-pointer"
            >
                <p className="text-gray-500">Drag & drop files here</p>
                <p className="text-gray-400 text-sm">or click to select</p>

                <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    // id="fileInput"
                />
            </label>

            {/* File List */}
            {/* FILES SELECTED (before upload starts) */}
            {!uploading && files.length > 0 && (
                <div className="bg-gray-100 text-black p-4 rounded space-y-2">
                    <h3 className="font-semibold">Files ready to upload:</h3>

                    {files.map((file, idx) => (
                        <div key={idx} className="text-sm text-gray-700">
                            {file.name}
                        </div>
                    ))}
                </div>
            )}

            {/* PER-FILE PROGRESS BARS */}
            {uploading && Object.keys(progressMap).length > 0 && (
                <div className="bg-gray-100 text-black p-4 rounded space-y-3">
                    <h3 className="font-semibold">Uploading Files:</h3>

                    {Object.entries(progressMap).map(([name, percent]) => (
                        <div key={name} className="space-y-1">
                            <div className="text-sm">{name}</div>

                            <div className="w-full bg-gray-300 h-2 rounded">
                                <div
                                    className="bg-blue-600 h-2 rounded transition-all"
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Button */}
            {files.length > 0 && (
                <button
                    onClick={uploadFiles}
                    disabled={uploading}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                    {uploading ? "Uploading..." : "Upload Files"}
                </button>
            )}

        </div>
    );
}
