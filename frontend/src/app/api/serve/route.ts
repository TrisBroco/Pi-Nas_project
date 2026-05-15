import { NextRequest } from "next/server";
import { proxyWithAuth } from "@/app/lib/proxyWithAuth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") ?? "";

    const backendURL = `${BACKEND_URL}/api/serve?filename=${encodeURIComponent(filename)}`;
    return proxyWithAuth(backendURL, { method: "GET" });
}