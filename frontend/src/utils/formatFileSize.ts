export function formatFileSize(sizeInBytes: number, decimalPlaces: number = 2): string {
    const KB = 1024;
    const MB = KB * 1024;
    const GB = MB * 1024;

    if (sizeInBytes >= GB) {
        return `${(sizeInBytes / GB).toFixed(decimalPlaces)} GB`;
    } else if (sizeInBytes >= MB) {
        return `${(sizeInBytes / MB).toFixed(decimalPlaces)} MB`;
    } else if (sizeInBytes >= KB) {
        return `${(sizeInBytes / KB).toFixed(decimalPlaces)} KB`;
    } else {
        return `${sizeInBytes} Bytes`;
    }
}