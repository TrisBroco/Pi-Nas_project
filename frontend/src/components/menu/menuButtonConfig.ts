import {MdCreateNewFolder} from "react-icons/md";
import {FcHome} from "react-icons/fc";
import {MdFolderShared} from "react-icons/md";
import {FcClock} from "react-icons/fc";
import {BiSolidVideos} from "react-icons/bi";
import {IoDocumentSharp, IoTrash} from "react-icons/io5";
import {IoMdPhotos} from "react-icons/io";
import {MdFavorite} from "react-icons/md";

export const menuButtonConfig = [
    {
        id: "new",
        items: [
            { name: "New Upload", icon: MdCreateNewFolder, action: "upload", path: "/" },
        ],
    },
    {
        id: "main",
        items: [
            { name: "Home", icon: FcHome, action: "home", path: "/" },
            { name: "Recent", icon: FcClock, color: "text-black", active:false,  action: "route", path: "/dashboard" },
            { name: "Shared", icon: MdFolderShared, color: "text-yellow-500", active:false,  action: "route", path: "/dashboard" },
        ],
    },
    {
        id: "secondary",
        items: [
            { name: "Favorites", icon: MdFavorite, color: "text-pink-600",  action: "modal" },
        ],
    },
    {
        id: "filter",
        items: [
            { name: "Documents", icon: IoDocumentSharp, color: "text-blue-400",  action: "documents" },
            { name: "Pictures", icon: IoMdPhotos, color: "text-green-400",  action: "pictures" },
            { name: "Videos", icon: BiSolidVideos, color: "text-red-600",  action: "videos" },
        ],
    },
    {
        id: "trash",
        items: [
            { name: "Trash", icon: IoTrash, color: "text-gray-400",  action: "Trash" }
        ]
    }
];