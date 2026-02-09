import React from "react";

import {BsSearch} from "react-icons/bs";
import {BiUser} from "react-icons/bi";
import {IoSettingsSharp} from "react-icons/io5";
import {IoMenu} from "react-icons/io5";

const HeaderMain = ({ onMenuClick }) => {
    return (
        <div className="w-full border-gray-200">

            <div className="flex justify-between items-center w-full h-[50px] text-[1.5rem]">

                <div className="sm:hidden flex items-center justify-start h-full w-[15%]">
                <button
                    onClick={() => {
                        // console.log("Menu Hamburger Clicked!");
                        onMenuClick();
                    }}
                    className="header-btn">
                    <IoMenu/>
                </button>
                </div>

                {/*SEARCH BAR*/}
                <div
                    className="w-[70%] sm:w-[80%]  h-full flex items-center text-[1rem] border-gray-400 border bg-[#36393b] rounded-4xl ">
                    <input
                        className="h-full w-full px-6 text-white placeholder:text-white outline-none bg-transparent"
                        type="text"
                        placeholder="Search"
                    />
                    <div className="h-full w-[4rem] text-white ">
                    <button
                        className=" header-btn rounded-l-none h-full w-full flex justify-center items-center">
                        <BsSearch size={20}/>
                    </button>
                    </div>
                </div>

                {/*USER ICONS*/}
                <div
                    className="sm:gap-2 sm:w-[30%] w-[15%] flex justify-center items-center sm:justify-end h-full sm:pr-2 ">
                    <button className="header-btn">
                        <IoSettingsSharp className="hidden sm:flex"/>
                    </button>
                    <button className="header-btn">
                        <BiUser/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeaderMain;
