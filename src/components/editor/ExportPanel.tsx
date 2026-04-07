'use client';
import { useState } from 'react';
import type { EditorProject } from '@/types';

interface ExportPanelProps {
  editorProject: EditorProject;
  projectId: string;
}

const FORMAT_PRESETS = [
  { label: 'Instagram Feed', width: 1080, height: 1080, ar: '1:1' },
  { label: 'Reels / TikTok / Shorts', width: 1080, height: 1920, ar: '9:16' },
  { label: 'YouTube Video', width: 1920, height: 1080, ar: '16:9' },
  { label: 'Pinterest', width: 1000, height: 1500, ar: '2:3' },
];

export default function ExportPanel({ editorProject, projectId }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setExporting(true); setProgress(0); setOutputUrl(null); setError('');
    try {
      // Server-seitiger Fallback Render
      const res = await fetch('/api/render', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editorProject, projectId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.outputPath) {
        setOutputUrl(data.outputPath);
        setProgress(100);
      } else throw new Error(data.error || 'Render fehlgeschlagen');
    } catch (e) {
      setError(String(e));
    }
    setExporting(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm text-[#94a3b8] uppercase tracking-wider">📤 Export</h3>

      <div className="space-y-2">
        <p className="text-xs text-[#94a3b8]">Format-Vorlagen</p>
        <div className="grid grid-cols-2 gap-2">
          {FORMAT_PRESETS.map(p => (
            <button key={p.label} className="btn btn-ghost btn-sm text-xs text-left">
              <div>
                <div className="font-semibold">{p.label}</div>
                <div className="opacity-60">{p.width}×{p.height} ({p.ar})</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0f0f1a] rounded-lg p-3 text-xs text-[#94a3b8] space-y-1">
        <div>📐 {editorProject.width}×{editorProject.height}</div>
        <div>🎞 {editorProject.fps} fps · {(editorProject.durationFrames / editorProject.fps).toFixed(1)}s</div>
        <div>🎬 {editorProject.tracks.reduce((s, t) => s + t.clips.length, 0)} Clips</div>
      </div>

      {exporting && (
        <div>
          <div className="w-full bg-[#2d2d44] rounded-full h-2 mb-1 overflow-hidden">
            <div className="h-2 bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-[#94a3b8] text-center">Wird gerendert… {progress}%</p>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {outputUrl && (
        <div className="space-y-2">
          <p className="text-xs text-green-400">✅ Export fertig!</p>
          <a href={outputUrl} download className="btn btn-primary btn-sm w-full text-center">⬇ Download MP4</a>
          <button onClick={() => fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: outputUrl }) })}
            className="btn btn-ghost btn-sm w-full text-xs">📁 Im Explorer öffnen</button>
        </div>
      )}

      <button onClick={handleExport} disabled={exporting} className="btn btn-primary w-full disabled:opacity-50">
        {exporting ? '⏳ Rendert…' : '🎬 Video rendern & exportieren'}
      </button>
    </div>
  );
}
