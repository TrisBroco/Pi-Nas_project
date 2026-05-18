import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: NextRequest) {
    const body = await request.text();
    const backendRes = await fetch(`${BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });

    const data = await backendRes.json();
    const response = NextResponse.json(data, { status: backendRes.status });

    // Forward cookies so user is logged in immediately after signup
    backendRes.headers.getSetCookie().forEach(cookie => {
        response.headers.append("Set-Cookie", cookie);
    });

    return response;
}