"use client";
import { createContext, useContext } from "react";

// 1. Create the "Radio Station" (Context)
const StorageContext = createContext(null);

// 2. Create the Provider (The "Broadcast Tower")
export function StorageProvider({ children, value }) {
    return (
        <StorageContext.Provider value={value}>
            {children}
        </StorageContext.Provider>
    );
}

// 3. Create a Custom Hook (The "Radio Receiver")
export function useStorage() {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error("useStorage must be used within a StorageProvider");
    }
    return context;
}