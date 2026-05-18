// app/api/profile/route.ts — hits backend, returns username + isAdmin
import { proxyWithAuth } from "@/app/lib/proxyWithAuth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET() {
    return proxyWithAuth(`${BACKEND_URL}/auth/me`, { method: "GET" });
}