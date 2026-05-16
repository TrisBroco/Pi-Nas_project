// components/GlobalModal.jsx
"use client";
import { useUI } from "@/context/UIContext";
import UploadArea from "./views/UploadArea";
import VideoPreview from "./views/VideoPreview";
import ImagePreview from "./views/ImagePreview";
import DownloadPreview from "@/components/views/DownloadPreview";
import NewFolderView from "@/components/views/NewFolderView";

export default function GlobalModal({ currentPath, navigateTo, refreshStorage }) {
    const { modal, closeModal } = useUI();
    console.log("GlobalModal")

    if (!modal.isOpen) return null;

    // Helper to determine title/header based on view
    const getTitle = () => {
       return modal.title;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
            onClick={closeModal} // Close if clicking the backdrop
        >
            <div
                className="relative max-w-[90%] max-h-[90%] min-w-[60%] min-h-[60%] bg-white rounded-2xl  flex flex-col p-2"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-2">
                    <h2 className="w-[90%] text-xl font-bold text-gray-800">{getTitle()}</h2>

                    {/*/!* Close Button *!/*/}
                    <button
                        onClick={closeModal}
                        className="w-[10%] flex-grow text-black text-4xl hover:bg-gray-100 mr-auto rounded-full transition-colors"
                    >&times;</button>
                </div>


                {/* Conditional Rendering based on "view" */}
                <div className="flex-grow p-2 overflow-hidden flex flex-col">
                    {modal.view === "upload" && <UploadArea currentFolder={currentPath} navigateTo={navigateTo} refreshStorage={refreshStorage}/>}
                    {modal.view === "video" && <VideoPreview src={modal.data?.url} />}
                    {modal.view === "image" && <ImagePreview src={modal.data?.url} />}
                    {modal.view === "other" && <DownloadPreview src={modal.data}/>}
                    {modal.view === "newFolder" && (
                        <NewFolderView
                            currentPath={modal.data?.currentPath}
                            navigateTo={navigateTo}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}