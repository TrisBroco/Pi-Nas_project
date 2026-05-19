// lib/proxyWithAuth.ts
import {cookies} from "next/headers";
import {NextResponse} from "next/server";

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
    return cookie ? {Cookie: cookie} : {};
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
            {error: "Not authenticated"},
            {status: 401}
        );
    }

    // Try original request
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

    // If access token expired → try refresh
    if (backendRes.status === 401 && refreshToken) {
        console.log("access expired — refreshing");

        const newAccessToken = await refreshAccessToken(refreshToken);

        if (!newAccessToken) {
            console.log("session expired");
            return NextResponse.json({ error: "Session expired" }, { status: 401 });
        }

        // Retry with new token
        backendRes = await fetch(backendUrl, {
            ...options,
            headers: {
                ...buildCookieHeader(newAccessToken, refreshToken),
                ...(options.headers || {}),
            },
            cache: "no-store",
        });

        if (!backendRes.ok) {
            return NextResponse.json(
                { error: "Authentication failed after refresh" },
                { status: 401 }
            );
        }

        const response = await forwardResponse(backendRes);
        // Forward the new access token cookie to the browser
        const cookieValue = `access_token=${newAccessToken}; Path=/; HttpOnly; SameSite=Lax`;
        response.headers.append("Set-Cookie", cookieValue);
        return response;
    }

    return NextResponse.json(
        {error: "Authentication failed"},
        {status: 401}
    );
}

// try to persist across requests in the same server process
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
    // If already refreshing, wait for that instead of starting another
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const refreshRes = await fetch(REFRESH_URL, {
                method: "POST",
                headers: buildCookieHeader(undefined, refreshToken),
            });

            if (!refreshRes.ok) return null;

            const responseCookies = refreshRes.headers.getSetCookie();
            const newAccessCookie = responseCookies.find(c => c.startsWith("access_token="));
            return newAccessCookie?.split(";")[0].split("=")[1] ?? null;
        } finally {
            // Always clear the lock when done
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function forwardResponse(res: Response) {
    const contentType = res.headers.get("content-type") || "";

    let response: NextResponse;

    if (contentType.includes("application/json")) {
        response = NextResponse.json(await res.json(), {status: res.status});
    } else {
        // fix for browser lock-up on downloads. don't load into memory
        const headers = new Headers();
        ["content-type", "content-disposition", "content-length"].forEach(key => {
            const val = res.headers.get(key);
            if (val) headers.set(key, val);
        });
        response = new NextResponse(res.body, {status: res.status, headers});
    }

    res.headers.getSetCookie().forEach(cookie => {
        response.headers.append("Set-Cookie", cookie);
    });

    return response;
}
