import React from "react";

import {BsSearch} from "react-icons/bs";
import {BiUser} from "react-icons/bi";
import {IoSettingsSharp} from "react-icons/io5";
import {IoMenu} from "react-icons/io5";
import UserMenu from "@/components/menu/UserMenu";

const HeaderMain = ({ onMenuClick, searchQuery, setSearchQuery }) => {
    return (
        <div className="w-full border-gray-200">
            <div className="flex justify-between items-center w-full h-[50px] text-[1.5rem]">

                <div className="sm:hidden flex items-center justify-start h-full w-[15%]">
                    <button onClick={onMenuClick} className="header-btn">
                        <IoMenu/>
                    </button>
                </div>

                {/* SEARCH BAR */}
                <div className="w-[70%] sm:w-[80%] h-full flex items-center text-[1rem] border-gray-400 border bg-[#36393b] rounded-4xl">
                    <input
                        className="h-full w-full px-6 text-white placeholder:text-white outline-none bg-transparent"
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <div className="h-full w-[4rem] text-white">
                        {/* Clear button — only shows when typing */}
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="header-btn rounded-l-none h-full w-full flex justify-center items-center text-3xl"
                            >
                                &times;
                            </button>
                        ): (
                            <button className="header-btn rounded-l-none h-full w-full flex justify-center items-center">
                                <BsSearch size={20}/>
                            </button>
                        )}

                    </div>
                </div>

                <div className="sm:gap-2 sm:w-[30%] w-[15%] flex justify-center items-center sm:justify-end h-full sm:pr-2">
                    <button className="header-btn">
                        <IoSettingsSharp className="hidden sm:flex"/>
                    </button>
                    <UserMenu/>
                </div>
            </div>
        </div>
    );
};

export default HeaderMain;
