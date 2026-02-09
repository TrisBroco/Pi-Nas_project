"use client";

import {useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

// This component handles form submission and redirects on success.
export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        // Check if user is already logged in
        const checkLogin = async () => {
            try {
                const res = await fetch("/api/me", {
                    cache: "no-store",
                    credentials: "include",
                });

                if (res.ok) {
                    // Already logged in → redirect to home
                    router.push("/home");
                }
            } catch (err) {
                console.error("Error checking login:", err);
            }
        };

        checkLogin();
    }, [router]); // run once on mount

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        console.log("submit pressed");



        try {
            // Fetch targets the Next.js API Proxy, not the Spring Boot backend directly.
            console.log("try statement");
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });
            console.log("after await");

            const data = await res.json();

            // Check for the 'success: true' flag from our Next.js API route.
            if (res.ok && data.success) {
                // Cookies have been set in the browser by the Next.js API proxy response.
                router.push("/home"); // redirect to protected route.ts
            } else {
                // Display the error message forwarded from the backend via the proxy.
                setError(data.error || "Login failed. Check server logs.");
            }
        } catch (err) {
            console.log("catch block");
            setError("Network or Proxy error. Could not reach API route.");
        } finally {
            console.log("finally block");
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl border border-gray-200">
                <h1 className="mb-8 text-3xl font-bold text-gray-800 text-center flex items-center justify-center">
                    <LogIn className="w-6 h-6 mr-2 text-blue-600" /> NAS Login
                </h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username (e.g., user)"
                        className="rounded-lg border px-4 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                    />

                    <input
                        type="password"
                        placeholder="Password (e.g., pass)"
                        className="rounded-lg border px-4 py-2 text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />

                    {error && (
                        <p className="p-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>
            </div>
        </div>
    );
}