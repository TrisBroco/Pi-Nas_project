"use client";
import { useState, useRef, useEffect } from "react";

export default function VideoPreview({ src: filename }) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const videoRef = useRef(null);
    const lastTimeRef = useRef(0);
    const refreshLock = useRef(false); // Prevents double-refresh loops

    //TODO - VIDEO ROUTING change 5/11/2026 10:40
    const getStreamUrl = (count) =>
        `/api/stream?filename=${encodeURIComponent(filename)}&v=${count}`;

    // 1. We manage the source purely through an internal counter to avoid prop-drilling issues
    const [localCount, setLocalCount] = useState(0);

    const handleVideoError = async (e) => {
        const video = videoRef.current;
        if (!video) return;

        // ← Check lock FIRST before anything else
        if (refreshLock.current) {
            console.log("Refresh already in progress, ignoring error");
            return;
        }

        // Only handle code 4 (auth/source error) — ignore aborts from .load()
        if (!video.error || video.error.code !== 4) return;

        console.log("Authentication/Source error detected.");
        refreshLock.current = true;  // ← lock immediately, synchronously
        lastTimeRef.current = video.currentTime;
        setIsRefreshing(true);

        try {
            const res = await fetch(`/api/refresh`, { method: "POST" });

            if (res.ok) {
                const nextCount = localCount + 1;
                setLocalCount(nextCount);

                // Small delay before reloading — lets state settle
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.src = getStreamUrl(nextCount);
                        videoRef.current.load();
                    }
                    // Only release lock AFTER load is called
                    refreshLock.current = false;
                    setIsRefreshing(false);
                    console.log("Token refreshed. Resuming...");
                }, 300);
            } else {
                setError(true);
                refreshLock.current = false;
            }
        } catch (err) {
            console.error("Refresh error:", err);
            setError(true);
            refreshLock.current = false;
        }
    };

    const handleLoadedMetadata = () => {
        if (lastTimeRef.current > 0 && videoRef.current) {
            const video = videoRef.current;
            video.currentTime = lastTimeRef.current;

            // Try to play; if it fails (browser policy), it will stay paused at the correct time
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => console.log("User interaction required to resume"));
            }
            lastTimeRef.current = 0;
        }
    };

    if (error) return <div className="p-10 text-white bg-red-900/20 rounded-xl">Session expired. Please log in again.</div>;

    return (
        <div className="w-full h-full flex items-center justify-center p-2">
            <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-white/10">

                {/* Smooth Overlay */}
                {isRefreshing && (
                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-white text-sm tracking-wide font-medium">RESUMING SESSION</span>
                        </div>
                    </div>
                )}

                <video
                    ref={videoRef}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onError={handleVideoError}
                    onLoadedMetadata={handleLoadedMetadata}
                    // Initial Source
                    src={getStreamUrl(localCount)}
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>
    );
}