import yt_dlp
import asyncio
import uuid
import time
import logging
import os
import re
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Optional, Callable
from server.api.models import DownloadTask, DownloadStatus, DownloadFormat
from server.database import db

logger = logging.getLogger(__name__)

def clean_ansi(text):
    # More robust regex for ANSI codes
    ansi_escape = re.compile(r'(?:\x1B[@-_]|[\x80-\x9F])[0-?]*[ -/]*[@-~]')
    return ansi_escape.sub('', text)

class DownloadManager:


    def __init__(self):
        self.active_downloads: Dict[str, dict] = {} # task_id -> {'future': Future, 'opts': dict}
        self.executor = ThreadPoolExecutor(max_workers=3)
        self.progress_callback: Optional[Callable] = None
        self._cancel_flags: Dict[str, bool] = {}
        self._pause_flags: Dict[str, bool] = {}

    def set_progress_callback(self, callback: Callable):
        self.progress_callback = callback

    def _check_flags(self, task_id):
        if self._cancel_flags.get(task_id):
            raise Exception("CanceledByUser")
        # Simple pause loop
        while self._pause_flags.get(task_id):
            time.sleep(1)
            # Re-check cancel while paused
            if self._cancel_flags.get(task_id):
                raise Exception("CanceledByUser")

    def _progress_hook(self, d, task_id, loop):
        self._check_flags(task_id)

        if d['status'] == 'downloading':
            try:
                total_bytes = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                downloaded_bytes = d.get('downloaded_bytes', 0)
                progress = (downloaded_bytes / total_bytes * 100) if total_bytes > 0 else 0
                
                speed = d.get('speed', 0)
                speed_str = self._format_speed(speed)
                eta = d.get('eta', 0)
                
                update_data = {
                    "status": DownloadStatus.DOWNLOADING,
                    "progress": progress,
                    "speed": speed_str,
                    "eta": str(eta),
                    "total_size": str(total_bytes),
                    "downloaded_size": str(downloaded_bytes),
                    "updated_at": time.time()
                }
                
                if self.progress_callback:
                    asyncio.run_coroutine_threadsafe(
                        self.progress_callback(task_id, update_data), 
                        loop
                    )
            except Exception as e:
                logger.error(f"Error in progress hook: {e}")

        elif d['status'] == 'finished':
            logger.info(f"Download finished: {d.get('filename')}")
            # Final completion update is handled in the thread wrapper usually, 
            # but hook is useful for accurate 100% progress.
            update_data = {
                "status": DownloadStatus.DOWNLOADING, # Still processing
                "progress": 100.0,
                "output_file": d.get('filename'),
                "updated_at": time.time()
            }
            if self.progress_callback:
                asyncio.run_coroutine_threadsafe(
                    self.progress_callback(task_id, update_data),
                    loop
                )

    def _format_speed(self, speed):
        if not speed: return "0 B/s"
        if speed > 1024**3: return f"{speed/1024**3:.2f} GB/s"
        if speed > 1024**2: return f"{speed/1024**2:.2f} MB/s"
        if speed > 1024: return f"{speed/1024:.2f} KB/s"
        return f"{speed:.2f} B/s"

    def _download_thread(self, task_id: str, url: str, options: dict, loop):
        try:
            with yt_dlp.YoutubeDL(options) as ydl:
                ydl.download([url])
                
            db.update_task(task_id, {"status": DownloadStatus.COMPLETED, "progress": 100.0})
            if self.progress_callback:
                asyncio.run_coroutine_threadsafe(
                    self.progress_callback(task_id, {"status": DownloadStatus.COMPLETED, "progress": 100.0}),
                    loop
                )
                
        except Exception as e:
            if "CanceledByUser" in str(e):
                logger.info(f"Task {task_id} canceled by user")
                db.update_task(task_id, {"status": DownloadStatus.CANCELED})
                status = DownloadStatus.CANCELED
            else:
                error_msg = clean_ansi(str(e))
                logger.error(f"Download failed for {task_id}: {error_msg}")
                db.update_task(task_id, {"status": DownloadStatus.ERROR, "error_message": error_msg})
                status = DownloadStatus.ERROR

            if self.progress_callback:
                asyncio.run_coroutine_threadsafe(
                    self.progress_callback(task_id, {"status": status, "error_message": clean_ansi(str(e))}),
                    loop
                )
        finally:
            if task_id in self.active_downloads:
                del self.active_downloads[task_id]
            if task_id in self._cancel_flags:
                del self._cancel_flags[task_id]
            if task_id in self._pause_flags:
                del self._pause_flags[task_id]

    async def start_download(self, url: str, fmt: DownloadFormat, output_path: str = "downloads"):
        task_id = str(uuid.uuid4())
        # Capture the running loop from the main thread (where start_download is awaited)
        loop = asyncio.get_running_loop()
        
        if not os.path.exists(output_path):
            os.makedirs(output_path)
            
        task = DownloadTask(
            id=task_id,
            url=url,
            format=fmt,
            status=DownloadStatus.PENDING,
            created_at=time.time(),
            updated_at=time.time()
        )
        db.add_task(task)

        # Configure yt-dlp
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' if fmt == DownloadFormat.MP4 else 'bestaudio/best',
            'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),
            'progress_hooks': [lambda d: self._progress_hook(d, task_id, loop)], # Pass loop
            'noplaylist': True,
            'nocolor': True,
            'extractor_args': {
                'youtube': {
                    'player_client': ['android'],
                }
            },
        }
        
        if fmt == DownloadFormat.MP3:
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]

        # Pass loop to _download_thread
        future = self.executor.submit(self._download_thread, task_id, url, ydl_opts, loop)
        self.active_downloads[task_id] = {
            "future": future,
            "ops": ydl_opts
        }
        
        return task

    def pause_download(self, task_id: str):
        if task_id in self.active_downloads:
            self._pause_flags[task_id] = True
            db.update_task(task_id, {"status": DownloadStatus.PAUSED})
            return True
        return False

    def resume_download(self, task_id: str):
        if task_id in self._pause_flags:
            del self._pause_flags[task_id]
            db.update_task(task_id, {"status": DownloadStatus.DOWNLOADING})
            return True
        return False

    def cancel_download(self, task_id: str):
        if task_id in self.active_downloads:
            self._cancel_flags[task_id] = True
            # Make sure to unpause if paused so it hits the check
            if task_id in self._pause_flags:
                del self._pause_flags[task_id]
            return True
        return False

    def get_task(self, task_id: str):
        return db.get_task(task_id)

    def get_all_tasks(self):
        return db.get_all_tasks()

    def clear_all_tasks(self):
        return db.delete_all_tasks()

manager = DownloadManager()
