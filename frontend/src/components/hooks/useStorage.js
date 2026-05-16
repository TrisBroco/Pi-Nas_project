"use client"
import { useState, useCallback } from "react";

export function useStorage(initialData) {
    const [storageData, setStorageData] = useState(initialData);

    const refreshStorage = useCallback(async () => {
        try {
            const res = await fetch("/api/storage", { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            setStorageData(data);
        } catch (err) {
            console.error("Failed to refresh storage:", err);
        }
    }, []);

    return { storageData, refreshStorage };
}