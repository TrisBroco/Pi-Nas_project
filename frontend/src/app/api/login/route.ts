import { NextResponse } from "next/server";

// const BACKEND_LOGIN_URL = "http://backend:8080/auth/login";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(req: Request) {
    const { username, password } = await req.json();
    console.log("login route");
    try {
        // const backendRes = await fetch(`${BACKEND_LOGIN_URL}`, {
        const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!backendRes.ok) {
            const backendError = await backendRes.json().catch(() => ({ error: 'Invalid credentials or unknown backend error.' }));

            return NextResponse.json(
                { error: backendError.error || "Authentication failed" },
                { status: backendRes.status }
            );
        }

        // Get the Set-Cookie headers from the Spring Boot response
        const cookies = backendRes.headers.getSetCookie();
        console.log("Backend set-cookies:", cookies);

        // Create the success response for the client
        const response = NextResponse.json({ success: true, message: "Login successful" });

        // Set all received cookies on the client response
        cookies.forEach(cookie => {
            response.headers.append('Set-Cookie', cookie);
        });

        return response;

    } catch (err) {
        console.error("Login Proxy Error:", err);
        return NextResponse.json({ error: "Server error during proxy request" }, { status: 500 });
    }
}