import { redirect } from "next/navigation";
import { cookies }   from "next/headers";  // <-- CRITICAL: Read cookies from the client request
import { FileRecord} from "@/types/FileRecord";

interface File {
    name: string;
    size: number;
    // ... other properties
}

// This component is a Server Component, fetching data via the *Next.js API proxy*.
export default async function FilesPage() {
    console.log("files page");
    // 1. Read the raw Cookie header string from the client request
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

    const user = "admin"; // or dynamic from auth
    const currentFolder = ""; // or dynamic folder path

    // CRITICAL: Ensure the fetch URL is correct for your local setup.
    // If your app is running on 3000, this is correct.
    const frontEndUrl = process.env.NEXT_PUBLIC_API_BASE;
    const listFilesURL = `${frontEndUrl}/api/files`
    console.log(`API URL: ${listFilesURL}}`);

    const res = await fetch(listFilesURL, {
        method: "GET",
        // Crucial: Must be 'no-store' to ensure dynamic rendering and cookies are read correctly
        cache: 'no-store', // Always necessary for dynamic content/auth
        credentials:"include",
        // CRITICAL: Explicitly pass the 'Cookie' header from the client to the proxy
        headers: {
            'Cookie': cookieHeader
        }
    });

    // 3. Failure Check
    if (!res.ok) {
        // If the proxy returns 401, redirect to login
        const errorBody = await res.json().catch(() => ({ error: 'Unknown authentication failure' }));
        console.error("Files Page Fetch Failed:", res.status, errorBody.error);

        redirect("/login");
    }

    // 4. Success
    const data = await res.json();
    const files: FileRecord[] = Array.isArray(data.files) ? data.files : [];

    return (
        <>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-indigo-700">Your Secure Files</h1>
                {files.length === 0 ? (
                    <p className="text-gray-500">No files found. Try uploading one!</p>
                ) : (
                    <ul className="space-y-4">
                        {files.map((file: FileRecord) => {

                            // --- File Size Logic ---
                            const sizeInBytes = file.size;
                            const KB = 1024;
                            const MB = KB * 1024;
                            const GB = MB * 1024;

                            let displaySize: string;
                            if (sizeInBytes >= GB) {
                                displaySize = `${(sizeInBytes / GB).toFixed(2)} GB`;
                            } else if (sizeInBytes >= MB) {
                                displaySize = `${(sizeInBytes / MB).toFixed(2)} MB`;
                            } else if (sizeInBytes >= KB) {
                                displaySize = `${(sizeInBytes / KB).toFixed(2)} KB`;
                            } else {
                                displaySize = `${sizeInBytes} Bytes`;
                            }

                            // --- Build download URL (through your Next.js proxy) ---
                            const downloadUrl = `/api/download?path=${encodeURIComponent(file.path)}`;
                            // console.log(file.mimeType + " " + file.dateCreated)
                            return (
                                <li key={file.id} className="p-4 bg-white shadow rounded-lg border border-indigo-100">
                                {/*<li key={index} className="p-4 bg-white shadow rounded-lg border border-indigo-100">*/}
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-lg text-indigo-900">
                                            {file.name}
                                        </p>

                                        <a
                                            href={downloadUrl}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                                        >
                                            Download
                                        </a>
                                    </div>

                                    <p className="text-sm text-gray-600">
                                        Type: {file.mimeType}
                                    </p>

                                    <p className="text-sm text-gray-600">
                                        Size: {displaySize}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-1">
                                        Uploaded: {new Date(file.dateCreated).toLocaleString()}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <p className="mt-8 text-xs text-gray-400">
                    If you are seeing this, authentication was successful via the Next.js proxy.
                </p>
            </div>
        </>
    );
}