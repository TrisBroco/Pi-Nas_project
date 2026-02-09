"use client"

import ListItem from "@/components/ListItem";
import {CiBoxList} from "react-icons/ci";
import {IoGridOutline} from "react-icons/io5";
import {useState} from "react";
import {useUI} from "@/context/UIContext";

export default function Body({files}) {
    const [organize, setOrganize] = useState("list");


    return (
        // The Body wrapper must grow and manage its own children's heights
        <div className="flex-grow flex justify-start h-[90%] gap-2">


            {/* RIGHT PANEL: Files List (Vertical flex container) */}
            <div className={"  rounded-2xl bg-[#131314] border-black w-full h-full flex flex-col"}>

                {/* Top section (Info/Sort Area): Takes natural height */}
                <div className="relative w-full flex min-h-[55px] text-[1.25rem]">
                    {/*File Name column*/}
                    <div className="w-[80%] flex items-center h-full sm:w-[55%] flex-none ps-4">File</div>
                    {/*dateModified column | Hidden on mobile*/}
                    <div className="hidden items-center h-full sm:flex sm:w-[25%] flex-none ">Date</div>
                    {/*size info Column  | Hidden on mobile*/}
                    <div className="hidden items-center h-full sm:flex sm:w-[15%] flex-none ">Size</div>

                    <div className="absolute top-2.5 right-2.5 z-10 text-[15px] border-[0.25px] rounded-full border-yellow-600">
                        <button
                            onClick={() => setOrganize("list")}
                            className={`header-btn pl-4 rounded-r-none ${organize.startsWith("l") ? 'bg-yellow-600/70' : ''}`}>
                            <CiBoxList/></button>
                        <button
                            onClick={() => setOrganize("grid")}
                            className={`header-btn pr-4 rounded-l-none ${organize.startsWith("g") ? 'bg-yellow-600/70' : ''}`}>
                            <IoGridOutline/></button>
                    </div>
                </div>

                {/* Files List: Must grow and be the only scrolling area */}
                <div className=" flex-grow overflow-y-auto rounded-br-2xl pl-2 pr-2">

                    {files.length === 0 ? (
                        <p className="text-gray-500">No files found. Try uploading one!</p>
                    ) : (
                        files.map((file) => (
                                <ListItem
                                    key={file.id}
                                    file = {file}/>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
}