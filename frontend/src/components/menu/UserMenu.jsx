"use client"
import { useEffect, useRef, useState } from "react";
import { BiUser } from "react-icons/bi";
import { FiLogOut } from "react-icons/fi";

export default function UserMenu() {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/login";
    };

    return (
        <div ref={menuRef} className="relative flex items-center">
            <button
                className="header-btn"
                onClick={() => setOpen(prev => !prev)}
            >
                <BiUser />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#2a2b2c] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-600/20"
                    >
                        <FiLogOut /> Logout
                    </button>
                </div>
            )}
        </div>
    );
}