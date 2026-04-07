'use client';
import { useState } from 'react';
import type { Project, ContentItem } from '@/types';
import PlatformBadge from '@/components/ui/PlatformBadge';

interface Phase7Props { project: Project; items: ContentItem[]; onRestart: () => void; }

export default function Phase7Export({ project, items, onRestart }: Phase7Props) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const downloadZip = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/download-zip', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_export.zip`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setDownloading(false);
  };

  const openFolder = (filePath?: string) => fetch('/api/open-folder', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filePath ? { filePath } : { folderPath: `./tmp/projects/${project.id}` }),
  });

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  };

  const itemsDone = items.filter(it => it.imageUrl || it.videoUrl).length;

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-[#f1f5f9] mb-1">Fertig! „{project.name}"</h2>
        <p className="text-[#94a3b8]">{itemsDone} von {items.length} Beiträgen mit Assets</p>
      </div>

      {/* Aktions-Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={downloadZip} disabled={downloading} className="btn btn-primary px-6">
          {downloading ? '⏳ Erstelle ZIP…' : '⬇ Alles als ZIP herunterladen'}
        </button>
        <button onClick={() => openFolder()} className="btn btn-ghost px-6">📁 Projektordner öffnen</button>
        <button onClick={onRestart} className="btn btn-ghost px-6">+ Neues Projekt</button>
      </div>

      {/* Projekt-Info */}
      <div className="card bg-[#0f0f1a] grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        {[
          { label: 'Plattformen', value: project.platforms.length },
          { label: 'Beiträge', value: items.length },
          { label: 'Bilder', value: items.filter(i => i.imageUrl).length },
          { label: 'Videos', value: items.filter(i => i.videoUrl).length },
        ].map(s => (
          <div key={s.label}>
            <div className="text-2xl font-bold text-[#a855f7]">{s.value}</div>
            <div className="text-xs text-[#94a3b8]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Content-Karten */}
      <div className="space-y-4">
        {items.map(item => {
          const isExpanded = expanded === item.id;
          const captionFull = item.caption || '';
          const hashtagText = (item.hashtags || []).join(' ');
          const copyAll = `${captionFull}\n\n${hashtagText}`;

          return (
            <div key={item.id} className="card space-y-3">
              {/* Bild / Video + Titel */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 space-y-1">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-24 h-24 rounded-lg object-cover" />
                  )}
                  {item.videoUrl && (
                    <video src={item.videoUrl} className="w-24 h-24 rounded-lg object-cover" controls />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <PlatformBadge platform={item.platform} />
                    <span className="font-semibold text-sm">{item.title}</span>
                  </div>
                  {/* Dateipfade mit Explorer-Button */}
                  <div className="space-y-1 mt-2">
                    {item.imageLocalPath && (
                      <button onClick={() => openFolder(item.imageLocalPath)}
                        className="group flex items-center gap-2 text-xs text-[#94a3b8] hover:text-purple-300 w-full text-left">
                        <span>🖼</span>
                        <span className="font-mono truncate group-hover:text-purple-300">{item.imageLocalPath}</span>
                        <span className="flex-shrink-0 opacity-0 group-hover:opacity-100">📂</span>
                      </button>
                    )}
                    {item.videoLocalPath && (
                      <button onClick={() => openFolder(item.videoLocalPath)}
                        className="group flex items-center gap-2 text-xs text-[#94a3b8] hover:text-purple-300 w-full text-left">
                        <span>🎬</span>
                        <span className="font-mono truncate group-hover:text-purple-300">{item.videoLocalPath}</span>
                        <span className="flex-shrink-0 opacity-0 group-hover:opacity-100">📂</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Caption */}
              {captionFull && (
                <div className="bg-[#0f0f1a] rounded-lg p-3">
                  <p className={`text-xs text-[#94a3b8] whitespace-pre-line ${isExpanded ? '' : 'line-clamp-4'}`}>
                    {captionFull}
                  </p>
                  {captionFull.length > 200 && (
                    <button onClick={() => setExpanded(isExpanded ? null : item.id)}
                      className="text-xs text-purple-400 hover:text-purple-300 mt-1">
                      {isExpanded ? '▲ Weniger anzeigen' : '▼ Vollständig anzeigen'}
                    </button>
                  )}
                </div>
              )}

              {/* Alle Hashtags */}
              {(item.hashtags || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(item.hashtags || []).map(tag => (
                    <span key={tag} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              {/* Aktions-Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {captionFull && (
                  <button onClick={() => copyText(item.id + '_caption', captionFull)}
                    className="btn btn-ghost btn-sm text-xs">
                    {copied === item.id + '_caption' ? '✓ Kopiert!' : '📋 Caption kopieren'}
                  </button>
                )}
                {hashtagText && (
                  <button onClick={() => copyText(item.id + '_tags', hashtagText)}
                    className="btn btn-ghost btn-sm text-xs">
                    {copied === item.id + '_tags' ? '✓ Kopiert!' : '#️⃣ Hashtags kopieren'}
                  </button>
                )}
                {captionFull && hashtagText && (
                  <button onClick={() => copyText(item.id + '_all', copyAll)}
                    className="btn btn-ghost btn-sm text-xs">
                    {copied === item.id + '_all' ? '✓ Kopiert!' : '📋 Alles kopieren'}
                  </button>
                )}
                {item.imageUrl && (
                  <a href={item.imageUrl} download className="btn btn-ghost btn-sm text-xs">⬇ Bild</a>
                )}
                {item.videoUrl && (
                  <a href={item.videoUrl} download className="btn btn-ghost btn-sm text-xs">⬇ Video</a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
