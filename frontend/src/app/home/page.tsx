import HomeClient from "@/components/HomeClient";
import {redirect} from "next/navigation";
import {FileRecord} from "@/types/FileRecord";
import {cookies} from "next/headers";
import {StorageProvider} from "@/context/StorageContext";
import {UIProvider} from "@/context/UIContext";
import {FolderRecord} from "@/types/FolderRecord";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
    const resolvedParams = await searchParams;
    const currentPath = resolvedParams.path ?? "";


    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
        .map(c => `${c.name}=${c.value}`)
        .join("; ");

    const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;


    // Pass folderPath to the backend
    const res = await fetch(`${backendURL}/api/list?folderPath=${encodeURIComponent(currentPath)}`, {
        headers: { "Cookie": cookieHeader },
        cache: "no-store",
    });

    if (!res.ok) redirect("/login");

    const storageRes = await fetch(`${backendURL}/api/storage`, {
        headers: {"Cookie": cookieHeader}
    });

    const storageData: { usedStorage: number, maxStorage: number } = await storageRes.json();

    // Success, file and folder info will be extracted.
    const data = await res.json();
    const files: FileRecord[] = Array.isArray(data.files) ? data.files : [];
    const folders: FolderRecord[] = Array.isArray(data.folders) ? data.folders : [];
    const user: string = data.user === null ? "" : data.user;

    return (
        <UIProvider>
            <StorageProvider value={storageData}>
                <HomeClient files={files}
                            folders={folders}
                            currentPath={currentPath}
                            />
            </StorageProvider>
        </UIProvider>
    );
}