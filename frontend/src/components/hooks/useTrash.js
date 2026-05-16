"use client"
import { useState, useCallback } from "react";

export function useTrash() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTrash = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/trash", { cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            setFiles(Array.isArray(data.files) ? data.files : []);
        } catch (err) {
            console.error("Failed to fetch trash:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const restore = async (fileId) => {
        const res = await fetch("/api/restore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: fileId }),
        });
        if (res.ok) await fetchTrash();
        else alert("Restore failed");
    };

    const permanentDelete = async (fileId, fileName) => {
        if (!confirm(`Permanently delete "${fileName}"? This cannot be undone.`)) return;
        const res = await fetch("/api/delete/permanent", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: fileId }),
        });
        if (res.ok) {
            await fetchTrash();
            window.dispatchEvent(new CustomEvent("file-deleted"));
        }
        else alert("Delete failed");
    };

    return { files, loading, fetchTrash, restore, permanentDelete };
}