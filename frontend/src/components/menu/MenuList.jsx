"use client";

import MenuButtons from "@/components/menu/MenuButtons";
import Image from "next/image";
import React from "react";

import {menuButtonConfig} from "./menuButtonConfig";
import { useStorage } from "@/context/StorageContext";


import {TiCloudStorage} from "react-icons/ti";
import {formatFileSize} from "@/utils/formatFileSize";
import {useUI} from "@/context/UIContext";
import NewUploadMenu from "@/components/menu/NewUploadMenu";

import { useRouter } from "next/navigation";

export default function MenuList({isMobile, onClose, navigateTo, onViewChange, currentPath}) {
    // let used = 150;
    const storageData = useStorage();
    const {openModal} = useUI();

    const router = useRouter();

    // console.log("Full storageData object:", storageData);
    const used = storageData?.usedStorage || 0;
    const max = storageData?.maxStorage || 1;

    const free =  max -  used;
    const percentage = Math.round((used / max) * 100);

    function handleMenuAction(item) {
        console.log("handleMenuAction")
        switch (item.action) {
            case "home":
                onViewChange?.("files");
                navigateTo("");
                break;
            case "upload":
                console.log("upload button")
                openModal("upload");
                onClose?.();
                break;
            case "modal":
                // setSettingsOpen(true);
                break;
            case "logout":
                handleLogout();
                break;
            case "Trash":
                onViewChange?.("trash");
                onClose?.();
                break;
            case "admin":
                router.push("/admin");
                onClose?.();
                break;
        }
    }

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/login";
    };

    return (

        // 3. LEFT PANEL: Menu List (Must be a vertical flex container)
        <div className={`flex flex-col h-full ${isMobile ? 'p-6' : ''}`}>
            <div className="flex items-center justify-start ps-4 pb-4">
                <Image className={"hidden sm:block"}
                       src={"/logo-image.png"}
                       width={50} height={50} alt={"Logo Image"}
                />
            </div>

            <div className="pl-4 pb-4 pr-4 flex flex-grow flex-col overflow-y-auto gap-y-4">
                {/* New Upload Menu replaces the first button group */}
                <NewUploadMenu currentPath={currentPath} />

                {menuButtonConfig
                    .filter(group => group.id !== "new") // ← skip the "new" group
                    .map((group) => (
                        <div key={group.id} className="flex flex-col">
                            {group.items.map((item) => (
                                <MenuButtons
                                    key={item.name}
                                    name={item.name}
                                    icon={item.icon}
                                    color={item.color}
                                    size={item.size}
                                    isActive={item.active}
                                    onClick={() => handleMenuAction(item)}
                                />
                            ))}
                        </div>
                    ))}
            </div>

            {/* The storage details can be positioned at the bottom */}
            <div className="mt-auto flex flex-col w-[full] items-center">
                <MenuButtons name={"Storage Details"} icon={TiCloudStorage}/>
                {/*Progress Bar Outer area*/}
                <div className="w-full h-1.5 bg-red-200/50 rounded-full overflow-hidden">
                    {/*Progress Inner filled area*/}
                    <div
                        className="h-full bg-yellow-600 transition-all"
                        style={{width: `${percentage}%`}}
                    />
                </div>
                {/*Space used*/}
                <div className="text-sm text-white/70 mt-2">
                    {formatFileSize(free)} of {formatFileSize(max, 0)} Free
                </div>
            </div>
        </div>
    );
}