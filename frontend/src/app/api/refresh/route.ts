import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
        return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: "POST",
        headers: { Cookie: `refresh_token=${refreshToken}` },
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
    }

    const responseCookies = res.headers.getSetCookie();
    const response = NextResponse.json({ success: true });
    for (const cookie of responseCookies) {
        response.headers.append("Set-Cookie", cookie);
    }
    return response;
}