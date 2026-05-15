"use client"
import {useState, useMemo, useEffect} from "react";
import { Trie } from "@/utils/Trie";

export function useFiles(initialFiles, initialFolders, initialPath) {
    const [files, setFiles] = useState(initialFiles);
    const [folders, setFolders] = useState(initialFolders);
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");


    // Rebuild trie whenever files or folders change
    const trie = useMemo(() => Trie.build(files, folders), [files, folders]);

    // Search results — empty query shows nothing
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return null; // null = not searching
        return trie.search(searchQuery);
    }, [trie, searchQuery]);

    const navigateTo = async (path) => {
        setLoading(true);
        setSearchQuery(""); // to clear search when navigating
        try {
            const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
                cache: "no-store",
            });

            if (!res.ok) {
                console.error("Failed to fetch files:", res.status);
                return;
            }

            const data = await res.json();
            setFiles(Array.isArray(data.files) ? data.files : []);
            setFolders(Array.isArray(data.folders) ? data.folders : []);
            setCurrentPath(path);

            // Update URL without full reload
            window.history.pushState({}, "", path === "" ? "/" : `/?path=${encodeURIComponent(path)}`);
        } catch (err) {
            console.error("Navigation error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const refresh = () => navigateTo(currentPath);
        window.addEventListener("file-deleted", refresh);
        return () => window.removeEventListener("file-deleted", refresh);
    }, [currentPath]);

    return {
        files, folders, currentPath,
        loading, navigateTo,
        searchQuery, setSearchQuery,
        searchResults,  // null = not searching, [] = no matches, [...] = matches
    };
}