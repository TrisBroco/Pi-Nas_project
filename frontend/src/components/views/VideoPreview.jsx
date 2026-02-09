"use client";
import { useState, useRef, useEffect } from "react";

export default function VideoPreview({ src: filename }) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(false);

    const videoRef = useRef(null);
    const lastTimeRef = useRef(0);
    const refreshLock = useRef(false); // Prevents double-refresh loops

    const getStreamUrl = (count) =>
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stream?filename=${encodeURIComponent(filename)}&v=${count}`;

    // 1. We manage the source purely through an internal counter to avoid prop-drilling issues
    const [localCount, setLocalCount] = useState(0);

    const handleVideoError = async (e) => {
        // Only handle actual 401/network errors, ignore "Aborted" errors caused by .load()
        if (refreshLock.current || !videoRef.current) return;

        const video = videoRef.current;

        // If there's no error object or it's just a playback pause, exit
        if (video.error && video.error.code === 4) { // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED/Unauthorized
            console.log("Authentication/Source error detected.");
        } else if (!video.error) {
            return;
        }

        refreshLock.current = true;
        lastTimeRef.current = video.currentTime;
        setIsRefreshing(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
                method: 'POST',
                credentials: "include"
            });

            if (res.ok) {
                console.log("Token refreshed. Resuming...");
                const nextCount = localCount + 1;

                // CRITICAL: Manually update the video source and reload
                video.src = getStreamUrl(nextCount);
                video.load();

                setLocalCount(nextCount);
                setIsRefreshing(false);
                refreshLock.current = false;
            } else {
                setError(true);
            }
        } catch (err) {
            console.error("Refresh error:", err);
            setError(true);
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
                    crossOrigin="use-credentials"
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