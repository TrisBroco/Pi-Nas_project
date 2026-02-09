export default function ImagePreview(modal) {
    return (
        <div className="h-full flex items-center justify-center">
            <img src={modal.data?.url} alt="Preview" className="max-h-full object-contain" />
        </div>
    );
}

