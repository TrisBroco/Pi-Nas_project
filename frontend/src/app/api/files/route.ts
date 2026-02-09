import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import {proxyWithAuth} from "@/app/lib/proxyWithAuth"; // <-- CRITICAL NEXT.JS HELPER

// URLs
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const BACKEND_FILES_URL = `${BACKEND_URL}/api/list`;

export async function GET() {
    return proxyWithAuth(BACKEND_FILES_URL, {
        method: "GET",
    });
}