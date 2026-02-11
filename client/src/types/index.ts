export enum DownloadStatus {
    PENDING = "pending",
    DOWNLOADING = "downloading",
    PAUSED = "paused",
    COMPLETED = "completed",
    ERROR = "error",
    CANCELED = "canceled",
}

export enum DownloadFormat {
    MP4 = "mp4",
    MP3 = "mp3",
}

export interface DownloadTask {
    id: string;
    url: string;
    title?: string;
    format: DownloadFormat;
    status: DownloadStatus;
    progress: number;
    speed?: string;
    eta?: string;
    total_size?: string;
    downloaded_size?: string;
    error_message?: string;
    output_file?: string;
    created_at: number;
    updated_at: number;
}

export interface CreateDownloadRequest {
    url: string;
    format: DownloadFormat;
    output_path?: string;
}
