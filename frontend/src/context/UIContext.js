"use client";
import {createContext, useContext, useState} from "react";

const UIContext = createContext(null);

export function UIProvider({children}) {
    const [modal, setModal] = useState({
        isOpen: false,
        view: "upload", // 'upload', 'video', 'image'
        data: null      // Holds the file URL or metadata
    });

    const openModal = (view, data = null) => setModal({isOpen: true, view, data});
    const closeModal = () => setModal({isOpen: false, view: "upload", data: null});

    return (
        <UIContext.Provider value={{modal, openModal, closeModal}}>
            {children}
        </UIContext.Provider>
    );
}

export const useUI = () => useContext(UIContext);