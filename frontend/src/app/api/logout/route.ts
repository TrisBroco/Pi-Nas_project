import { NextRequest } from "next/server";
import { proxyWithAuth } from "@/app/lib/proxyWithAuth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST() {
    return proxyWithAuth(`${BACKEND_URL}/auth/logout`, { method: "POST" });
}