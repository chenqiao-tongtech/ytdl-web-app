import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DownloadFormat } from '../types';
import { Download, Loader2, Settings } from 'lucide-react';

export const DownloadForm: React.FC = () => {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<DownloadFormat>(DownloadFormat.MP4);
    const [downloadPath, setDownloadPath] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const savedPath = localStorage.getItem('downloadPath');
        if (savedPath) {
            setDownloadPath(savedPath);
        } else {
            setDownloadPath('downloads'); // Default
        }
    }, []);

    const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPath = e.target.value;
        setDownloadPath(newPath);
        localStorage.setItem('downloadPath', newPath);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted with URL:", url);
        if (!url.trim()) return;

        setLoading(true);
        setError(null);
        try {
            await api.createDownload({
                url,
                format,
                output_path: downloadPath || 'downloads'
            });
            setUrl('');
        } catch (err) {
            setError('Failed to start download. Please check the URL and backend status.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Download size={24} /> New Download
                </h2>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </div>

            {showSettings && (
                <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius)' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        Download Folder (on server)
                    </label>
                    <input
                        type="text"
                        value={downloadPath}
                        onChange={handlePathChange}
                        placeholder="downloads"
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                        }}
                    />
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        id="video-url"
                        name="url"
                        type="url"
                        placeholder="Paste YouTube URL here..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            minWidth: '200px'
                        }}
                    />

                    <select
                        id="download-format"
                        name="format"
                        value={format}
                        onChange={(e) => setFormat(e.target.value as DownloadFormat)}
                        style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value={DownloadFormat.MP4}>Video (MP4)</option>
                        <option value={DownloadFormat.MP3}>Audio (MP3)</option>
                    </select>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius)',
                            background: 'var(--accent-color)',
                            color: 'white',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? <Loader2 className="spin" size={20} /> : 'Download'}
                    </button>
                </div>

                {error && (
                    <div style={{ color: 'var(--error-color)', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}
            </form>

            <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};
