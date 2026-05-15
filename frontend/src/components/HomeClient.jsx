"use client";
import {useState} from "react";
import MobileDrawer from "./views/MobileDrawer";
import MenuList from "./menu/MenuList";
import HeaderMain from "./HeaderMain";
import Body from "./Body";
import { useFiles } from "./hooks/useFiles";
import GlobalModal from "@/components/GlobalModal";

export default function HomeClient({ files: initialFiles, folders: initialFolders, currentPath: initialPath }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const {
        files, folders, currentPath,
        loading, navigateTo,
        searchQuery, setSearchQuery, searchResults
    } = useFiles(initialFiles, initialFolders, initialPath);

    return (
        /* Ensure the main container is EXACTLY the height of the screen and cannot scroll */
        <div className="p-4 h-screen w-full bg-[#1e1f20] flex overflow-hidden">
            {/* MOBILE DRAWER (Uses Portal, doesn't affect this flexbox) */}
            <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* DESKTOP SIDEBAR (Static/Normal) */}
            <div className="hidden sm:flex flex-none w-[15rem]">
                <MenuList isMobile={false} navigateTo={navigateTo}/>
            </div>

            {/* MAIN CONTENT (Header + Body) */}
            <div className={"w-full flex flex-col gap-y-4"}>
                <HeaderMain onMenuClick={() => setIsMenuOpen(true)}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                />
                <Body
                    files={files}
                    folders={folders}
                    currentPath={currentPath}
                    loading={loading}
                    navigateTo={navigateTo}
                    searchResults={searchResults}
                />
                <GlobalModal currentPath={currentPath} navigateTo={navigateTo} />
            </div>
        </div>
    );
}
