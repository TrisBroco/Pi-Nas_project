import HomeClient from "@/components/HomeClient";
import {redirect} from "next/navigation";
import {FileRecord} from "@/types/FileRecord";
import {cookies} from "next/headers";
import {StorageProvider} from "@/context/StorageContext";
import {UIProvider} from "@/context/UIContext";
import GlobalModal from "@/components/GlobalModal";

export default async function HomePage() {
    console.log("home page");
    console.log("IS SERVER:", typeof window === "undefined");

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;


    // Fetch directly from Spring Boot, NOT your own /api/files
    const res = await fetch(`${backendURL}/api/list`, {
        headers: {
            "Cookie": cookieHeader
        },
        cache: "no-store",
    });

    if (!res.ok) redirect("/login");

    const storageRes = await fetch(`${backendURL}/api/storage`, {
        headers: {"Cookie": cookieHeader}
    });

    const storageData: { usedStorage: number, maxStorage: number } = await storageRes.json();

    // 4. Success
    const data = await res.json();
    const files: FileRecord[] = Array.isArray(data.files) ? data.files : [];


    return (
        <UIProvider>
            <StorageProvider value={storageData}>
                {/* Now you don't need to pass storageData to HeaderMain! */}
                <HomeClient files={files}/>
                <GlobalModal/>
            </StorageProvider>
        </UIProvider>
    );
}