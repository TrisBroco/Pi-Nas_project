"use client";
import {useState} from "react";
import MobileDrawer from "./views/MobileDrawer";
import MenuList from "./menu/MenuList";
import HeaderMain from "./HeaderMain";
import Body from "./Body";
import {useFiles} from "./hooks/useFiles";
import GlobalModal from "@/components/GlobalModal";
import TrashView from "@/components/views/TrashView";
import {useStorage} from "./hooks/useStorage";
import {StorageProvider} from "@/context/StorageContext";
import {UIProvider} from "@/context/UIContext";

export default function HomeClient({
                                       files: initialFiles,
                                       folders: initialFolders,
                                       currentPath: initialPath,
                                       storageData: initialStorage
                                   }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [view, setView] = useState("files"); // "files" | "trash"

    const {storageData, refreshStorage} = useStorage(initialStorage);

    const {
        files, folders, currentPath,
        loading, navigateTo,
        searchQuery, setSearchQuery, searchResults
    } = useFiles(initialFiles, initialFolders, initialPath, refreshStorage);

    return (
        <UIProvider>
            <StorageProvider value={storageData}>
                {/* Ensure the main container is EXACTLY the height of the screen and cannot scroll */}
                <div className="p-4 h-screen w-full bg-[#1e1f20] flex overflow-hidden">
                    {/* MOBILE DRAWER (Uses Portal, doesn't affect this flexbox) */}
                    <MobileDrawer isOpen={isMenuOpen}
                                  onClose={() => setIsMenuOpen(false)}
                                  navigateTo={navigateTo}
                                  onViewChange={setView}
                                  currentPath={currentPath}/>

                    {/* DESKTOP SIDEBAR (Static/Normal) */}
                    <div className="hidden sm:flex flex-none w-[15rem]">
                        <MenuList
                            isMobile={false}
                            navigateTo={navigateTo}
                            onViewChange={setView}
                            currentPath={currentPath}
                        />
                    </div>

                    {/* MAIN CONTENT (Header + Body) */}
                    <div className={"w-full flex flex-col gap-y-4"}>
                        <HeaderMain onMenuClick={() => setIsMenuOpen(true)}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                        />
                        {view === "trash" ? (
                            <TrashView/>
                        ) : (
                            <Body
                                files={files}
                                folders={folders}
                                currentPath={currentPath}
                                loading={loading}
                                navigateTo={navigateTo}
                                searchResults={searchResults}
                            />
                        )}
                        <GlobalModal currentPath={currentPath} navigateTo={navigateTo} refreshStorage={refreshStorage}/>
                    </div>
                </div>
            </StorageProvider>
        </UIProvider>
    );
}
