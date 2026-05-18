"use client";

import {useEffect, useState, Suspense} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {LogIn} from "lucide-react";

// This component handles form submission and redirects on success.
    function LoginContent() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [registrationOpen, setRegistrationOpen] = useState(false);
    const [notice, setNotice] = useState("");
    const searchParams = useSearchParams();

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

    // Poll every 5 seconds for registration settings change. (only on the login page)
    useEffect(() => {
        const checkRegistration = async () => {
            try {
                const res = await fetch("/api/admin/settings");
                if (res.ok) {
                    const data = await res.json();
                    setRegistrationOpen(data.registrationOpen);
                }
            } catch {
            }
        };

        checkRegistration(); // immediate first check
        const interval = setInterval(checkRegistration, 5000);
        return () => clearInterval(interval); // cleanup on unmount
    }, []);

    // Read notice from URL on mount
    useEffect(() => {
        if (searchParams.get("notice") === "registration-closed") {
            setNotice("Signup is currently unavailable.");
            // Clean the URL so the notice doesn't persist on refresh
            router.replace("/login");
        }
    }, [searchParams, router]);

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
                headers: {"Content-Type": "application/json"},
                credentials: "include",
                body: JSON.stringify({username, password}),
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
                {/* Notice banner — only shows when redirected from signup */}
                {notice && (
                    <div
                        className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 text-center">
                        {notice}
                    </div>
                )}

                <h1 className="mb-8 text-3xl font-bold text-gray-800 text-center flex items-center justify-center">
                    <LogIn className="w-6 h-6 mr-2 text-blue-600"/> NAS Login
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
                    {registrationOpen && (
                        <button
                            type="button"
                            onClick={() => router.push("/signup")}
                            className="text-sm text-blue-600 hover:text-blue-800 text-center"
                        >
                            Don&#39;t have an account? Sign up
                        </button>
                    )}

                </form>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading login...</div>}>
            <LoginContent />
        </Suspense>
    );
}