"use client";
import {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // Check registration status on mount
    useEffect(() => {
        const checkRegistration = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                if (res.ok) {
                    const data = await res.json();
                    if (!data.registrationOpen) {
                        // Redirect with a query param so LoginPage can show the message
                        router.replace("/login?notice=registration-closed");
                        return;
                    }
                }
            } catch {
                // If check fails, redirect to be safe
                router.replace("/login?notice=registration-closed");
                return;
            } finally {
                setChecking(false);
            }
        };

        checkRegistration();
    }, [router]);

    // Don't render the form until the check completes — prevents flash of content
    if (checking) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                router.push("/home");
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl border border-gray-200">
                <h1 className="mb-8 text-3xl font-bold text-gray-800 text-center flex items-center justify-center">
                    <UserPlus className="w-6 h-6 mr-2 text-blue-600" /> Create Account
                </h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        className="rounded-lg border px-4 py-2 text-gray-800"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Password (min 8 characters)"
                        className="rounded-lg border px-4 py-2 text-gray-800"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Confirm password"
                        className="rounded-lg border px-4 py-2 text-gray-800"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        disabled={loading}
                    />

                    {error && (
                        <p className="p-2 bg-red-100 text-red-700 rounded-lg text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="text-sm text-gray-500 hover:text-gray-700 text-center"
                    >
                        Already have an account? Log in
                    </button>
                </form>
            </div>
        </div>
    );
}