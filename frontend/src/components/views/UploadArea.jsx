"use client";
import {useState, useRef} from "react";
import {useUI} from "@/context/UIContext";
import {formatFileSize} from "@/utils/formatFileSize";
import {useStorage} from "@/context/StorageContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Per-file status shape:
// { file, status: "pending"|"uploading"|"done"|"error", progress: 0-100, error: null|string }

export default function UploadArea({currentFolder, navigateTo, refreshStorage}) {
    const [fileStatuses, setFileStatuses] = useState([]);
    const [uploading, setUploading] = useState(false);
    const {closeModal} = useUI();
    const dropRef = useRef(null);
    const storageData = useStorage();

    const updateStatus = (index, patch) => {
        setFileStatuses(prev =>
            prev.map((item, i) => i === index ? {...item, ...patch} : item)
        );
    };

    const dragCounter = useRef(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounter.current += 1;
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        dragCounter.current -= 1;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        addFiles(Array.from(e.dataTransfer.files));
    };

    const handleFileSelect = (e) => {
        addFiles(Array.from(e.target.files));
    };

    const addFiles = (newFiles) => {
        const remaining = storageData.maxStorage - storageData.usedStorage;

        const entries = newFiles.map(file => {
            if (file.size > remaining) {
                return {
                    file,
                    status: "tooLarge",
                    progress: 0,
                    error: `File size exceeds your remaining ${formatFileSize(remaining)}.`
                };
            }
            return {file, status: "pending", progress: 0, error: null};
        });

        setFileStatuses(prev => [...prev, ...entries]);
    };

    const removeFile = (index) => {
        setFileStatuses(prev => prev.filter((_, i) => i !== index));
    };

    const uploadSingleFile = (file, index) => {
        return new Promise((resolve) => {
            const formData = new FormData();
            formData.append("file", file);

            const xhr = new XMLHttpRequest();
            xhr.open(
                "POST",
                `${BACKEND_URL}/api/upload?folder=${encodeURIComponent(currentFolder ?? "")}`
            );
            xhr.withCredentials = true;

            // Mark as uploading when it starts
            updateStatus(index, {status: "uploading", progress: 0});

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    // Cap at 95% — last 5% reserved for server processing
                    const percent = Math.min(
                        Math.round((e.loaded / e.total) * 100),
                        95
                    );
                    updateStatus(index, {progress: percent});
                }
            };

            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText);

                    if (xhr.status >= 200 && xhr.status < 300) {
                        // Check if this specific file had an error
                        const fileError = data.errors?.find(
                            e => e.filename === file.name
                        );
                        if (fileError) {
                            updateStatus(index, {
                                status: "error",
                                progress: 0,
                                error: fileError.error
                            });
                        } else {
                            updateStatus(index, {status: "done", progress: 100});
                        }
                    } else {
                        // HTTP error
                        const message = data.error
                            || data.errors?.[0]?.error
                            || `Server error (${xhr.status})`;
                        updateStatus(index, {
                            status: "error",
                            progress: 0,
                            error: message
                        });
                    }
                } catch {
                    updateStatus(index, {
                        status: "error",
                        progress: 0,
                        error: "Unexpected server response"
                    });
                }
                resolve();
            };

            xhr.onerror = () => {
                updateStatus(index, {
                    status: "error",
                    progress: 0,
                    error: "Network error"
                });
                resolve();
            };

            xhr.send(formData);
        });
    };

    const uploadFiles = async () => {
        dragCounter.current = 0;
        const pending = fileStatuses
            .map((s, i) => ({...s, index: i}))
            .filter(s => s.status === "pending" || s.status === "error");

        if (pending.length === 0) return;

        setUploading(true);

        for (const {file, index} of pending) {
            await uploadSingleFile(file, index);
        }

        setUploading(false);

        const allDone = fileStatuses.every(s => s.status === "done");
        if (allDone) {
            navigateTo(currentFolder ?? "");
            refreshStorage?.();
            closeModal?.();
        } else {
            // Some failed — refresh file list and storage but stay open
            // so user can see which ones failed
            navigateTo(currentFolder ?? "");
            refreshStorage?.();
        }
    };

    const clearFiles = async () => {
        const pending = fileStatuses
            .map((s, i) => ({...s, index: i}))
            .filter(s => s.status === "pending");

        setFileStatuses(pending);
    };

    const hasFiles = fileStatuses.length > 0;
    const hasPending = fileStatuses.some(s => s.status === "pending" || s.status === "error");
    const allDone = hasFiles && fileStatuses.every(s => s.status === "done");

    return (
        <div className="flex flex-col flex-grow h-max gap-y-4 overflow-hidden">

            {/* Drop zone — hide while uploading */}
            {/*TODO Maybe add an animation later for closing the update?*/}
            {!uploading && (
                <label
                    ref={dropRef}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex-2 flex flex-col items-center justify-center border-2
                    border-dashed rounded-lg p-10 text-center cursor-pointer
                    transition-colors
                    ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-400 hover:bg-blue-50 hover:border-blue-400"}`}
                >
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-gray-500">Drag & drop files here</p>
                        <p className="text-gray-400 text-sm">or click to select</p>
                    </div>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>
            )}

            {/* File list — always visible once files are added */}
            {hasFiles && (
                <div className="flex-grow overflow-y-auto flex flex-col gap-2">
                    {fileStatuses.map(({file, status, progress, error}, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg border text-sm
                                ${status === "done" ? "border-green-200 bg-green-50" :
                                status === "error" || status === "tooLarge" ? "border-red-200 bg-red-50" :
                                    status === "uploading" ? "border-blue-200 bg-blue-50" :
                                        "border-gray-200 bg-gray-50"}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={`font-medium truncate max-w-[70%]
                                    ${status === "error" || status === "tooLarge" ? "text-red-700" :
                                    status === "done" ? "text-green-700" :
                                        "text-gray-700"}`}>
                                    {file.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-xs">
                                        {formatFileSize(file.size)}
                                    </span>
                                    {!uploading && (
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="text-gray-400 hover:text-red-500 text-lg leading-none"
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">

                                {/* Progress bar — shows while uploading */}
                                {status === "uploading" && (
                                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                            style={{width: `${progress}%`}}
                                        />
                                    </div>
                                )}

                                {/* Error message */}
                                {(status === "error" || status === "tooLarge") && error && (
                                    <p className="w-[70%] md:w-max text-red-600 text-xs">{error}</p>
                                )}
                                <div> {/* Status badge */}
                                    {status === "done" && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-600 text-xs font-medium">✓ Done</span>
                                            <span
                                                className="text-blue-600 text-lg opacity-0 leading-none">&times;</span>
                                        </div>
                                    )}
                                    {(status === "error" || status === "tooLarge") && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-600 text-xs font-medium">✗ Failed</span>
                                            <span
                                                className="text-blue-600 text-lg opacity-0 leading-none">&times;</span>
                                        </div>
                                    )}
                                    {status === "uploading" && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-600 text-xs font-medium">{progress}%</span>
                                            <span
                                                className="text-blue-600 text-lg opacity-0 leading-none">&times;</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bottom actions */}
            <div className="flex gap-2 flex-none">
                {/* Upload button */}
                {hasPending && (
                    <button
                        onClick={uploadFiles}
                        disabled={uploading}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg
                                   hover:bg-blue-700 disabled:opacity-50 font-semibold"
                    >
                        {uploading ? "Uploading..." : `Upload ${fileStatuses.filter(s => s.status === "pending").length} file(s)`}
                    </button>
                )}

                {/* Close button — only when all done */}
                {allDone && (
                    <button
                        onClick={closeModal}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg
                                   hover:bg-green-700 font-semibold"
                    >
                        Done
                    </button>
                )}

                {/* Retry failed — shows if some failed */}
                {!uploading && fileStatuses.some(s => s.status === "error") && (
                    <button
                        onClick={uploadFiles}
                        className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg
                                   hover:bg-yellow-700 font-semibold"
                    >
                        Retry Failed Uploads
                    </button>
                )}

                {/* Clear failed — shows when some failed */}
                {!uploading && fileStatuses.some(s => s.status === "error" || s.status === "tooLarge") && (
                    <button
                        onClick={clearFiles}
                        className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg
                                   hover:bg-yellow-700 font-semibold"
                    >
                        Clear Failed Uploads
                    </button>
                )}
            </div>
        </div>
    );
}