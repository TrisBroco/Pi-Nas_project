import { NextRequest, NextResponse } from "next/server";
import { proxyWithAuth } from "@/app/lib/proxyWithAuth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET() {
    const res = await fetch(`${BACKEND_URL}/admin/settings`);
    const data = await res.json();
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    return proxyWithAuth(`${BACKEND_URL}/admin/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });
}