from pydantic import BaseModel, Field
from typing import Optional, Literal
from enum import Enum
from datetime import datetime

class DownloadStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELED = "canceled"

class DownloadFormat(str, Enum):
    MP4 = "mp4"
    MP3 = "mp3"

class DownloadRequest(BaseModel):
    url: str = Field(..., description="YouTube video URL")
    format: DownloadFormat = Field(default=DownloadFormat.MP4, description="Target format")
    output_path: Optional[str] = Field(None, description="Custom output directory")

class DownloadTask(BaseModel):
    id: str
    url: str
    title: Optional[str] = None
    format: DownloadFormat
    status: DownloadStatus
    progress: float = 0.0
    speed: Optional[str] = None
    eta: Optional[str] = None
    total_size: Optional[str] = None
    downloaded_size: Optional[str] = None
    error_message: Optional[str] = None
    output_file: Optional[str] = None
    created_at: float
    updated_at: float

class TaskUpdate(BaseModel):
    task_id: str
    status: DownloadStatus
    progress: float
    data: dict = {}
