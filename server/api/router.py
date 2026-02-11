from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import List
from server.api.models import DownloadRequest, DownloadTask
from server.core.downloader import manager
import logging
import asyncio
import json

router = APIRouter()
logger = logging.getLogger(__name__)

# --- WebSocket Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to websocket: {e}")

ws_manager = ConnectionManager()

# Hook up downloader progress to WebSocket
async def broadcast_progress(task_id: str, data: dict):
    # Combine task_id with data to identify which task updated
    message = {
        "task_id": task_id,
        "type": "progress_update",
        "data": data
    }
    await ws_manager.broadcast(message)

manager.set_progress_callback(broadcast_progress)

# --- Routes ---

@router.post("/downloads", response_model=DownloadTask)
async def create_download(request: DownloadRequest):
    """Start a new download task"""
    output_path = request.output_path or "downloads"
    task = await manager.start_download(request.url, request.format, output_path)
    return task

@router.get("/tasks", response_model=List[dict])
async def list_tasks():
    """Get all tasks history"""
    return manager.get_all_tasks()

@router.get("/tasks/{task_id}", response_model=dict)
async def get_task(task_id: str):
    """Get single task details"""
    task = manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.delete("/tasks")
async def clear_all_tasks():
    """Clear all download history"""
    manager.clear_all_tasks()
    await ws_manager.broadcast({"type": "tasks_cleared"})
    return {"status": "cleared"}

@router.post("/tasks/{task_id}/pause")
async def pause_task(task_id: str):
    success = manager.pause_download(task_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot pause task (not active or not found)")
    return {"status": "paused", "task_id": task_id}

@router.post("/tasks/{task_id}/resume")
async def resume_task(task_id: str):
    success = manager.resume_download(task_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot resume task")
    return {"status": "resumed", "task_id": task_id}

@router.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    success = manager.cancel_download(task_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel task")
    return {"status": "canceled", "task_id": task_id}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, maybe receive commands in future
            data = await websocket.receive_text()
            # Echo or handle commands
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
