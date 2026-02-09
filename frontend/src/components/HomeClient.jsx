// components/HomeClient.jsx
"use client";
import {useState} from "react";
import MobileDrawer from "./views/MobileDrawer";
import MenuList from "./menu/MenuList";
import HeaderMain from "./HeaderMain";
import Body from "./Body";

export default function HomeClient({ files}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        /* Ensure the main container is EXACTLY the height of the screen and cannot scroll */
        <div className="p-4 h-screen w-full bg-[#1e1f20] flex overflow-hidden">
            {/* 1. MOBILE DRAWER (Uses Portal, doesn't affect this flexbox) */}
            <MobileDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* 2. DESKTOP SIDEBAR (Static/Normal) */}
            <div className="hidden sm:flex flex-none w-[15rem]">
                <MenuList isMobile={false}/>
            </div>

            {/* 3. MAIN CONTENT (Header + Body) */}
            <div className={"w-full flex flex-col gap-y-4"}>
                <HeaderMain onMenuClick={() => setIsMenuOpen(true)} />
                <Body files={files}/>
            </div>
        </div>
    );
}
