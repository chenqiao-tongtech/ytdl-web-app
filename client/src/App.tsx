import { useEffect, useState } from 'react';
import { DownloadForm } from './components/DownloadForm';
import { TaskList } from './components/TaskList';
import { api, wsClient } from './services/api';
import type { DownloadTask } from './types';
import './styles/global.css';

function App() {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);

  const refreshTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshTasks();

    // Connect WebSocket
    wsClient.connect();

    // Subscribe to updates
    const unsubscribe = wsClient.subscribe((message) => {
      if (message.type === 'progress_update') {
        setTasks(prev => {
          const taskIndex = prev.findIndex(t => t.id === message.task_id);
          if (taskIndex === -1) {
            // If new task via another client or just created, re-fetch might be safer 
            // or we can append if we had full task data. 
            // For progress update, we assume generic update.
            // Ideally we should just partial update.
            refreshTasks();
            return prev;
          }

          const newTasks = [...prev];
          newTasks[taskIndex] = { ...newTasks[taskIndex], ...message.data };
          return newTasks;
        });
      } else if (message.type === 'tasks_cleared') {
        setTasks([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="container">
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, backgroundImage: 'linear-gradient(to right, var(--accent-color), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
          YouTube Downloader
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Download high-quality video and audio from YouTube
        </p>
      </header>

      <main>
        <DownloadForm />

        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Downloads
        </h2>
        <TaskList tasks={tasks} />
      </main>
    </div>
  );
}

export default App;
