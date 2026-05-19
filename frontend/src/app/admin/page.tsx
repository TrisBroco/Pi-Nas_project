"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();
    const [registrationOpen, setRegistrationOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const [checking, setChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    const handleGenerateThumbnails = async () => {
        const res = await fetch("/api/admin/thumbnails/generate", { method: "POST" });
        if (res.ok) setMessage("Thumbnail generation started — check server logs");
    };

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const res = await fetch("/api/profile");
                if (!res.ok) { router.replace("/login"); return; }
                const data = await res.json();
                if (!data.isAdmin) { router.replace("/home"); return; }
                setAuthorized(true);
            } finally {
                setChecking(false);
            }
        };
        checkAdmin();
    }, []);




    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                setRegistrationOpen(data.registrationOpen);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Block render until check is done
    // TODO - Change method to find Whether user is admin or not before showing admin button or console.

    if (checking) return null;
    if (!authorized) return null;

    const handleToggle = async () => {
        setSaving(true);
        setMessage("");
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registrationOpen: !registrationOpen }),
            });

            if (res.ok) {
                const data = await res.json();
                setRegistrationOpen(data.registrationOpen);
                setMessage(`Registration ${data.registrationOpen ? "enabled" : "disabled"}`);
            } else if (res.status === 403) {
                setMessage("Admin access required");
            }
        } catch {
            setMessage("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <p className="text-gray-500">Loading...</p>
        </div>
    );

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800 mb-8">Admin Panel</h1>

                <div className="flex items-center justify-between p-4 border rounded-lg mb-4">
                    <div>
                        <p className="font-semibold text-gray-800">User Registration</p>
                        <p className="text-sm text-gray-500">
                            Allow new users to create accounts
                        </p>
                    </div>
                    <button
                        onClick={handleToggle}
                        disabled={saving}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-200
                            ${registrationOpen ? "bg-blue-600" : "bg-gray-300"}
                            disabled:opacity-50`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full
                            shadow transition-transform duration-200
                            ${registrationOpen ? "translate-x-7" : "translate-x-0"}`}
                        />
                    </button>

                </div>
                <button
                onClick={handleGenerateThumbnails}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
                Generate Thumbnails for All Files
            </button>

                {message && (
                    <p className="text-sm text-center text-blue-600 mt-2">{message}</p>
                )}

                <button
                    onClick={() => router.push("/home")}
                    className="mt-6 w-full text-sm text-gray-500 hover:text-gray-700"
                >
                    ← Back to home
                </button>
            </div>
        </div>
    );
}