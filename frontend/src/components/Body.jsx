"use client"

import FilesListItem from "@/components/FilesListItem";
import {CiBoxList} from "react-icons/ci";
import {IoGridOutline} from "react-icons/io5";
import {useState} from "react";
import FolderItem from "@/components/FolderItem";

export default function Body({files, folders = [], currentPath = "", loading, navigateTo, searchResults}) {
    const pathSegments = currentPath ? currentPath.split("/") : [];
    const [organize, setOrganize] = useState("list");

    // Decide what to render in the list
    const isSearching = searchResults !== null;

    return (
        // The Body wrapper must grow and manage its own children's heights
        <div className="flex-grow flex justify-start h-[90%] gap-2">


            {/* RIGHT PANEL: Files List (Vertical flex container) */}
            <div className={"  rounded-2xl bg-[#131314] border-black w-full h-full flex flex-col"}>

                {/* Breadcrumbs using navigateTo*/}
                <div className="flex items-center gap-1 text-sm text-gray-400 px-4 py-2">
                    <button onClick={() => navigateTo("")} className="hover:text-yellow-400">Home</button>
                    {pathSegments.map((segment, i) => {
                        const segmentPath = pathSegments.slice(0, i + 1).join("/");
                        return (
                            <span key={segmentPath} className="flex items-center gap-1">
                    <span>/</span>
                    <button
                        onClick={() => navigateTo(segmentPath)}
                        className="hover:text-yellow-400"
                    >
                        {segment}
                    </button>
                </span>
                        );
                    })}
                </div>


                {/* Top section (Info/Sort Area): Takes natural height */}
                <div className="relative w-full flex min-h-[55px] text-[1.25rem]">
                    {/*File Name column*/}
                    <div className="w-[80%] flex items-center h-full sm:w-[55%] flex-none ps-4">
                        {isSearching ? `${searchResults.length} item(s) match.` : "File"}
                    </div>
                    {/*dateModified column | Hidden on mobile*/}
                    <div className="hidden items-center h-full sm:flex sm:w-[25%] flex-none ">Date</div>
                    {/*size info Column  | Hidden on mobile*/}
                    <div className="hidden items-center h-full sm:flex sm:w-[15%] flex-none ">Size</div>

                    <div
                        className="absolute top-2.5 right-2.5 z-10 text-[15px] border-[0.25px] rounded-full border-yellow-600">
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



                {/* Loading state */}
                {loading && <p className="text-gray-400 px-4">Loading...</p>}

                {/* Files List: Must grow and be the only scrolling area */}
                <div className=" flex-grow overflow-y-auto rounded-br-2xl pl-2 pr-2">


                    {isSearching ? (
                        // Search results view
                        searchResults.length === 0 ? (
                            <p className="text-gray-500 px-4">No results found.</p>
                        ) : (
                            searchResults.map((item) =>
                                item._type === "folder" ? (
                                    <FolderItem
                                        key={item.path}
                                        folder={item}
                                        currentPath={currentPath}
                                        navigateTo={navigateTo}
                                    />
                                ) : (
                                    <FilesListItem key={item.id} file={item}/>
                                )
                            )
                        )
                    ) : (
                        // Normal folder view
                        files.length === 0 && folders.length === 0 ? (
                            <p className="text-gray-500">No files found. Try uploading some!</p>
                        ) : (
                            <>
                                {folders.map((folder) => (
                                    <FolderItem
                                        key={folder.path}
                                        folder={folder}
                                        currentPath={currentPath}
                                        navigateTo={navigateTo}  // ← add this
                                    />
                                ))}
                                {files.map((file) => (
                                    <FilesListItem
                                        key={file.id}
                                        file={file}/>
                                ))}
                            </>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}