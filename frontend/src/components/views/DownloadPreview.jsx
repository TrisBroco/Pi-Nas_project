import {FiDownload} from "react-icons/fi";

export default function DownloadPreview({src: data}) {
    return (
        <div className="flex flex-grow  items-center justify-center h-full gap-4">

            <button
                onClick={() => {
                    const a = document.createElement("a");
                    a.href = `/api/download?filename=${encodeURIComponent(data?.url)}`;
                    a.download = data?.name ?? "file";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
                <FiDownload/> Download {data?.name}
            </button>
        </div>
    )
}