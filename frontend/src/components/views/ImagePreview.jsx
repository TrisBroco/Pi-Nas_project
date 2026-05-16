"use client";
import { useState, useEffect } from "react";

export default function ImagePreview({ src: filename }) {
    const [imgSrc, setImgSrc] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!filename) return;
        setImgSrc(`/api/serve?filename=${encodeURIComponent(filename)}`);
    }, [filename]);

    if (error) return (
        <div className="p-10 text-white bg-red-900/20 rounded-xl">
            Failed to load image.
        </div>
    );

    return (
        // <div className="w-full h-full flex items-center justify-center p-2">
        <div className="w-full max-w-5xl aspect-square rounded-2xl overflow-hidden relative">
            <img
                src={imgSrc}
                alt="Preview"
                className="w-full h-full object-contain rounded-xl"
                onError={() => setError(true)}
            />
        </div>
    );
}