import {NextRequest, NextResponse} from "next/server";
import {proxyWithAuth} from "@/app/lib/proxyWithAuth"; // <-- CRITICAL NEXT.JS HELPER

// URLs
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(request: NextRequest) {
    //read the ?path from the request. (browser nav)
    const {searchParams} = new URL(request.url);
    const path = searchParams.get("path") ?? "";

    // Forward that folder to the backend as folderPath=
    const backendURL = `${BACKEND_URL}/api/list?folderPath=${encodeURIComponent(path)}`;

    return proxyWithAuth(backendURL, {
        method: "GET",
    });
}