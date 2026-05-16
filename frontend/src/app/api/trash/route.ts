import { proxyWithAuth } from "@/app/lib/proxyWithAuth";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
export async function GET() {
    return proxyWithAuth(`${BACKEND_URL}/api/trash`, { method: "GET" });
}