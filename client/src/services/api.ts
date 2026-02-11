import axios from 'axios';
import type { CreateDownloadRequest, DownloadTask } from '../types';

const API_Base = '/api';

export const api = {
    createDownload: async (data: CreateDownloadRequest) => {
        const response = await axios.post<DownloadTask>(`${API_Base}/downloads`, data);
        return response.data;
    },

    getTasks: async () => {
        const response = await axios.get<DownloadTask[]>(`${API_Base}/tasks`);
        return response.data;
    },

    pauseTask: async (taskId: string) => {
        await axios.post(`${API_Base}/tasks/${taskId}/pause`);
    },

    resumeTask: async (taskId: string) => {
        await axios.post(`${API_Base}/tasks/${taskId}/resume`);
    },

    cancelTask: async (taskId: string) => {
        await axios.post(`${API_Base}/tasks/${taskId}/cancel`);
    },

    clearHistory: async () => {
        await axios.delete(`${API_Base}/tasks`);
    },
};

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private listeners: ((data: any) => void)[] = [];

    connect() {
        // Protocol should match current page (ws or wss)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use window.location.host to work with proxy
        const wsUrl = `${protocol}//${window.location.host}/api/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.listeners.forEach(listener => listener(data));
            } catch (e) {
                console.error("Failed to parse websocket message", e);
            }
        };

        this.ws.onclose = () => {
            console.log("WebSocket disconnected, retrying in 3s...");
            setTimeout(() => this.connect(), 3000);
        };

        this.ws.onerror = (err) => {
            console.error("WebSocket error", err);
        };
    }

    subscribe(callback: (data: any) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }
}

export const wsClient = new WebSocketClient();
