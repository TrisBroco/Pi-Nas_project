import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!accessToken && !refreshToken) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") ?? "";
    const v = searchParams.get("v") ?? "0";

    const backendURL = `${BACKEND_URL}/api/stream?filename=${encodeURIComponent(filename)}&v=${v}`;

    // Forward Range header for video seeking
    const rangeHeader = request.headers.get("Range");

    const backendRes = await fetch(backendURL, {
        method: "GET",
        headers: {
            Cookie: [
                accessToken ? `access_token=${accessToken}` : "",
                refreshToken ? `refresh_token=${refreshToken}` : ""
            ].filter(Boolean).join("; "),
            ...(rangeHeader ? { Range: rangeHeader } : {}),
        },
        // CRITICAL: don't buffer — stream directly
        // @ts-ignore
        duplex: "half",
    });

    if (!backendRes.ok) {
        return NextResponse.json(
            { error: "Stream failed" },
            { status: backendRes.status }
        );
    }

    // Forward the response headers needed for streaming
    const headers = new Headers();
    [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "cache-control",
    ].forEach(key => {
        const val = backendRes.headers.get(key);
        if (val) headers.set(key, val);
    });

    // Stream body directly — never buffer into memory
    return new NextResponse(backendRes.body, {
        status: backendRes.status,
        headers,
    });
}