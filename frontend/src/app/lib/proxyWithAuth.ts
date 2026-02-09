// lib/proxyWithAuth.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;
const REFRESH_URL = `${BACKEND_URL}/auth/refresh`;

function buildCookieHeader(
    accessToken?: string,
    refreshToken?: string
): HeadersInit {
    let cookie = "";
    if (accessToken) cookie += `access_token=${accessToken}`;
    if (refreshToken) {
        if (cookie) cookie += "; ";
        cookie += `refresh_token=${refreshToken}`;
    }
    return cookie ? { Cookie: cookie } : {};
}

export async function proxyWithAuth(
    backendUrl: string,
    options: RequestInit = {}
) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!accessToken && !refreshToken) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    // 1️⃣ Try original request
    let backendRes = await fetch(backendUrl, {
        ...options,
        headers: {
            ...buildCookieHeader(accessToken, refreshToken),
            ...(options.headers || {}),
        },
        cache: "no-store",
    });

    if (backendRes.ok) {
        return forwardResponse(backendRes);
    }

    // 2️⃣ If access token expired → try refresh
    if (backendRes.status === 401 && refreshToken) {
        console.log("access expired")
        const refreshRes = await fetch(REFRESH_URL, {
            method: "POST",
            headers: buildCookieHeader(undefined, refreshToken),
        });

        if (!refreshRes.ok) {
            console.log("session expired")
            return NextResponse.json(
                { error: "Session expired" },
                { status: 401 }
            );
        }

        // Forward refreshed cookies
        const responseCookies = refreshRes.headers.getSetCookie();

        // 1️⃣ Extract new access token
        const newAccessCookie = responseCookies.find(c => c.startsWith("access_token="));
        const newAccessToken = newAccessCookie?.split(";")[0].split("=")[1];

        if (!newAccessToken) {
            console.log("No access token in refresh response!");
            return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 });
        }

        // Retry original request (new access token is now valid)
        backendRes = await fetch(backendUrl, {
            ...options,
            headers: {
                ...buildCookieHeader(
                    // backend will read the NEW access token automatically
                    newAccessToken,
                    refreshToken
                ),
                ...(options.headers || {}),
            },
            cache: "no-store",
        });

        if (!backendRes.ok) {
            console.log("backendRes not okay")
            return NextResponse.json(
                { error: "Authentication failed after refresh" },
                { status: 401 }
            );
        }

        const response = forwardResponse(backendRes);
        for (const cookie of responseCookies) {
            (await response).headers.append("Set-Cookie", cookie);
        }

        return response;
    }

    return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
    );
}

async function forwardResponse(res: Response) {
    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        return NextResponse.json(await res.json());
    }

    // For streams / files later
    return new NextResponse(res.body, {
        status: res.status,
        headers: res.headers,
    });
}
