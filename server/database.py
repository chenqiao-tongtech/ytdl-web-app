import json
import os
from typing import List, Optional, Dict
from server.api.models import DownloadTask
import logging

logger = logging.getLogger(__name__)

DB_FILE = "download_history.json"

class Database:
    def __init__(self, db_file=DB_FILE):
        self.db_file = db_file
        self._ensure_db()

    def _ensure_db(self):
        if not os.path.exists(self.db_file):
            with open(self.db_file, 'w') as f:
                json.dump([], f)

    def _read_data(self) -> List[dict]:
        try:
            with open(self.db_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _write_data(self, data: List[dict]):
        with open(self.db_file, 'w') as f:
            json.dump(data, f, indent=2)

    def add_task(self, task: DownloadTask):
        data = self._read_data()
        # Convert model to dict, handling enums and other types
        task_dict = json.loads(task.model_dump_json())
        data.append(task_dict)
        self._write_data(data)

    def update_task(self, task_id: str, updates: dict):
        data = self._read_data()
        for i, item in enumerate(data):
            if item['id'] == task_id:
                data[i].update(updates)
                self._write_data(data)
                return
        logger.warning(f"Task {task_id} not found for update")

    def get_task(self, task_id: str) -> Optional[dict]:
        data = self._read_data()
        for item in data:
            if item['id'] == task_id:
                return item
        return None

    def get_all_tasks(self) -> List[dict]:
        return self._read_data()

    def delete_task(self, task_id: str):
        data = self._read_data()
        data = [item for item in data if item['id'] != task_id]
        self._write_data(data)

    def delete_all_tasks(self):
        self._write_data([])

db = Database()
