import React from 'react';
import { DownloadStatus, type DownloadTask } from '../types';
import { api } from '../services/api';
import {
    Play, Pause, XCircle, CheckCircle, AlertCircle, FileAudio, FileVideo, Trash2
} from 'lucide-react';

interface TaskListProps {
    tasks: DownloadTask[];
}

const ProgressBar: React.FC<{ progress: number; status: DownloadStatus }> = ({ progress, status }) => {
    let color = 'var(--accent-color)';
    if (status === DownloadStatus.ERROR || status === DownloadStatus.CANCELED) color = 'var(--error-color)';
    if (status === DownloadStatus.COMPLETED) color = 'var(--success-color)';
    if (status === DownloadStatus.PAUSED) color = 'var(--warning-color)';

    return (
        <div style={{
            width: '100%',
            height: '8px',
            background: 'var(--border-color)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: '0.5rem'
        }}>
            <div style={{
                width: `${Math.max(0, Math.min(100, progress))}%`,
                height: '100%',
                background: color,
                transition: 'width 0.3s ease'
            }} />
        </div>
    );
};

export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
    const sortedTasks = [...tasks].sort((a, b) => b.updated_at - a.updated_at);

    const handlePause = (id: string) => api.pauseTask(id);
    const handleResume = (id: string) => api.resumeTask(id);
    const handleCancel = (id: string) => api.cancelTask(id);

    const handleClearHistory = async () => {
        if (window.confirm('Are you sure you want to clear all download history?')) {
            try {
                await api.clearHistory();
            } catch (e) {
                console.error("Failed to clear history", e);
            }
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No downloads yet. Start one above!
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={handleClearHistory}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(255, 59, 48, 0.1)',
                        color: 'var(--error-color)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                    }}
                >
                    <Trash2 size={16} /> Clear History
                </button>
            </div>

            {sortedTasks.map(task => (
                <div key={task.id} className="glass-panel" style={{ padding: '1rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
                            {task.format === 'mp3' ? <FileAudio size={24} color="var(--text-secondary)" /> : <FileVideo size={24} color="var(--text-secondary)" />}

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{
                                    fontSize: '1rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    marginBottom: '0.25rem'
                                }}>
                                    {task.title || task.url}
                                </h3>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    <span>{task.status.toUpperCase()}</span>
                                    {task.status === DownloadStatus.DOWNLOADING && (
                                        <>
                                            <span>{task.speed}</span>
                                            <span>ETA: {task.eta}s</span>
                                        </>
                                    )}
                                    {task.total_size && <span>{task.received_bytes} / {task.total_size}</span>}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            {task.status === DownloadStatus.DOWNLOADING && (
                                <>
                                    <button onClick={() => handlePause(task.id)} title="Pause">
                                        <Pause size={20} color="var(--text-secondary)" />
                                    </button>
                                    <button onClick={() => handleCancel(task.id)} title="Cancel">
                                        <XCircle size={20} color="var(--error-color)" />
                                    </button>
                                </>
                            )}

                            {task.status === DownloadStatus.PAUSED && (
                                <>
                                    <button onClick={() => handleResume(task.id)} title="Resume">
                                        <Play size={20} color="var(--success-color)" />
                                    </button>
                                    <button onClick={() => handleCancel(task.id)} title="Cancel">
                                        <XCircle size={20} color="var(--text-secondary)" />
                                    </button>
                                </>
                            )}

                            {task.status === DownloadStatus.COMPLETED && <CheckCircle size={20} color="var(--success-color)" />}
                            {task.status === DownloadStatus.ERROR && <AlertCircle size={20} color="var(--error-color)" />}
                        </div>
                    </div>

                    <ProgressBar progress={task.progress} status={task.status} />

                    {task.error_message && (
                        <div style={{ color: 'var(--error-color)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                            Error: {task.error_message}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
