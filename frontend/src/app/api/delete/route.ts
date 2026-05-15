import { NextRequest } from "next/server";
import { proxyWithAuth } from "@/app/lib/proxyWithAuth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function DELETE(request: NextRequest) {
    const body = await request.text();
    const backendURL = `${BACKEND_URL}/api/delete`;

    return proxyWithAuth(backendURL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body,
    });
}