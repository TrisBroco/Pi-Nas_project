import { NextRequest } from "next/server";
import { proxyWithAuth } from "@/app/lib/proxyWithAuth";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
export async function POST(request: NextRequest) {
    const body = await request.text();
    return proxyWithAuth(`${BACKEND_URL}/api/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });
}