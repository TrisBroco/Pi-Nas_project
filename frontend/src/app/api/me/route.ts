// /api/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    console.log("/api/me check");

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    // ❌ No refresh token = not logged in
    if (!refreshToken) {
        console.log("/api/me | no refresh token");
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // ✅ Refresh token exists → user is logged in
    return NextResponse.json({ authenticated: true }, { status: 200 });
}
