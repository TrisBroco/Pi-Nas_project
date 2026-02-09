export interface FileRecord {
    id: number;
    name: string;
    extension: string;
    mimeType: string;
    ownerId: number;
    size: number;
    checksum: string;
    path: string;
    folderPath: string;
    dateCreated: string;
    dateModified: string;
    isDeleted: boolean;
    version: number;
    metadata: Record<string, any>;
}
