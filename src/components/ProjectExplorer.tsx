'use client';
import { useState, useEffect, useRef } from 'react';
import type { Project, ContentItem, ProjectExplorerData, ReportInfo } from '@/types';

const PHASE_LABELS: Record<number, string> = {
  1: 'Projekt', 2: 'Strategie', 3: 'Bilder', 4: 'Captions',
  5: 'Voice', 6: 'Videos', 7: 'Editor', 8: 'Export',
};

interface ProjectExplorerProps {
  onClose: () => void;
  onResumeProject: (project: Project, items: ContentItem[], completedSteps: number[], targetStep: number) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function ProjectExplorer({ onClose, onResumeProject, onDeleteProject }: ProjectExplorerProps) {
  const [data, setData] = useState<ProjectExplorerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('/api/project-explorer')
      .then(r => r.json())
      .then(d => setData(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePlayAudio = (url: string, id: string) => {
    if (playingAudio === id) {
      audioRef.current?.pause();
      setPlayingAudio(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    audio.onended = () => setPlayingAudio(null);
    setPlayingAudio(id);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenFolder = (filePath: string) => {
    fetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Projekt wirklich loeschen? Alle Dateien werden entfernt.')) return;
    await fetch('/api/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: projectId }),
    });
    setData(prev => prev.filter(d => d.project.id !== projectId));
    onDeleteProject(projectId);
  };

  const handleResume = (entry: ProjectExplorerData, reportItems?: ContentItem[]) => {
    const { project, phase } = entry;
    // Prioritaet: 1. uebergebene Report-Items, 2. persistierte Contents, 3. leer
    const items = (reportItems && reportItems.length > 0)
      ? reportItems
      : (project.contents && project.contents.length > 0)
        ? project.contents
        : [];
    onResumeProject(project, items, phase.completed, phase.nextPhase);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="card max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#1a1a2e] pb-2 z-10">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {'📂'} Projekt-Explorer
            </h3>
            <button onClick={onClose} className="btn btn-ghost btn-sm text-xs">{'✕'} Schliessen</button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent" />
              <span className="ml-3 text-sm text-[#94a3b8]">Projekte werden geladen...</span>
            </div>
          ) : data.length === 0 ? (
            <p className="text-sm text-[#94a3b8] py-4">Noch keine Projekte vorhanden.</p>
          ) : (
            <div className="space-y-4">
              {data.map(entry => (
                <ProjectCard
                  key={entry.project.id}
                  entry={entry}
                  onResume={(reportItems?: ContentItem[]) => handleResume(entry, reportItems)}
                  onDelete={() => handleDelete(entry.project.id)}
                  onOpenFolder={handleOpenFolder}
                  onPreview={setPreview}
                  onPlayAudio={handlePlayAudio}
                  playingAudio={playingAudio}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {preview && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
            {preview.type === 'image' ? (
              <img src={preview.url} alt="Vorschau" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
            ) : (
              <video src={preview.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
            )}
            <button onClick={() => setPreview(null)}
              className="absolute top-2 right-2 text-white text-xl bg-black/60 rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/80">
              {'✕'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Projekt-Karte ──────────────────────────────────────────────────────────

interface ProjectCardProps {
  entry: ProjectExplorerData;
  onResume: (reportItems?: ContentItem[]) => void;
  onDelete: () => void;
  onOpenFolder: (path: string) => void;
  onPreview: (p: { type: 'image' | 'video'; url: string }) => void;
  onPlayAudio: (url: string, id: string) => void;
  playingAudio: string | null;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}

function ProjectCard({ entry, onResume, onDelete, onOpenFolder, onPreview, onPlayAudio, playingAudio, onCopy, copiedId }: ProjectCardProps) {
  const { project, counts, phase, reportDetails } = entry;
  const beitraege = reportDetails.filter(r => r.type === 'beitrag');
  const videoscripts = reportDetails.filter(r => r.type === 'videoscript');

  return (
    <div className="bg-[#0f0f1a] rounded-lg border border-[#2d2d44] overflow-hidden">
      {/* Kopfzeile */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm truncate">{'📋'} {project.name}</h4>
              <span className="text-[10px] text-[#64748b] shrink-0">
                {new Date(project.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mb-2">
              {project.platforms.map(p => p.replace('_', ' ')).join(', ')}
            </p>

            {/* Asset-Zaehler + Phasen */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {counts.images > 0 && <AssetBadge icon="🖼" count={counts.images} label="Bilder" color="blue" />}
              {counts.audios > 0 && <AssetBadge icon="🎵" count={counts.audios} label="Audios" color="green" />}
              {counts.videos > 0 && <AssetBadge icon="🎬" count={counts.videos} label="Videos" color="orange" />}
              <div className="flex items-center gap-0.5 ml-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <div key={n} className={`w-2 h-2 rounded-full ${
                    phase.status[n] === 'done' ? 'bg-green-500' :
                    phase.status[n] === 'partial' ? 'bg-yellow-500' : 'bg-[#2d2d44]'
                  }`} title={`${PHASE_LABELS[n]}: ${phase.status[n] || 'missing'}`} />
                ))}
                <span className="text-[10px] text-[#64748b] ml-1">{phase.completed.length}/8</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <div className="flex gap-1.5">
              <button onClick={() => onOpenFolder(`tmp/projects/${project.id}`)}
                className="btn btn-ghost btn-sm text-xs flex-1">
                {'📂'} Ordner
              </button>
              <button onClick={onDelete} className="btn btn-danger btn-sm text-xs">{'🗑'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Berichte — immer sichtbar */}
      {(beitraege.length > 0 || videoscripts.length > 0) && (
        <div className="border-t border-[#2d2d44] px-4 py-3 bg-[#12122a]">
          {beitraege.map(report => (
            <ReportBlock
              key={report.filename}
              report={report}
              projectId={project.id}
              project={project}
              phase={phase}
              onOpenFolder={onOpenFolder}
              onPreview={onPreview}
              onPlayAudio={onPlayAudio}
              playingAudio={playingAudio}
              onCopy={onCopy}
              copiedId={copiedId}
              contentItems={project.contents || []}
              onResume={onResume}
            />
          ))}
          {videoscripts.map(report => (
            <ReportBlock
              key={report.filename}
              report={report}
              projectId={project.id}
              project={project}
              phase={phase}
              onOpenFolder={onOpenFolder}
              onPreview={onPreview}
              onPlayAudio={onPlayAudio}
              playingAudio={playingAudio}
              onCopy={onCopy}
              copiedId={copiedId}
              contentItems={project.contents || []}
              onResume={onResume}
            />
          ))}
        </div>
      )}

      {/* Wenn keine Berichte aber Contents vorhanden */}
      {beitraege.length === 0 && videoscripts.length === 0 && project.contents && project.contents.length > 0 && (
        <div className="border-t border-[#2d2d44] px-4 py-3 bg-[#12122a]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#64748b]">Inhalte ({project.contents.length} Teile, noch kein Bericht exportiert)</p>
            <button onClick={() => onResume()} className="btn btn-primary btn-sm text-xs">
              {'▶'} Weiter ab Phase {phase.nextPhase} ({PHASE_LABELS[phase.nextPhase]})
            </button>
          </div>
          {project.contents.map((item, idx) => (
            <ContentItemRow
              key={item.id} item={item} index={idx}
              onPreview={onPreview} onPlayAudio={onPlayAudio} playingAudio={playingAudio}
              onCopy={onCopy} copiedId={copiedId} onOpenFolder={onOpenFolder}
            />
          ))}
        </div>
      )}

      {/* Wenn gar nichts da — Assets als flache Liste */}
      {beitraege.length === 0 && videoscripts.length === 0 && (!project.contents || project.contents.length === 0) && (
        <div className="border-t border-[#2d2d44] px-4 py-3 bg-[#12122a]">
          {(counts.images > 0 || counts.audios > 0 || counts.videos > 0) ? (
            <FlatAssetList entry={entry} onPreview={onPreview} onPlayAudio={onPlayAudio} playingAudio={playingAudio} />
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#64748b]">Noch keine Assets generiert.</p>
              <button onClick={() => onResume()} className="btn btn-primary btn-sm text-xs">
                {'▶'} Weiter ab Phase {phase.nextPhase} ({PHASE_LABELS[phase.nextPhase]})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bericht-Block ──────────────────────────────────────────────────────────

interface ReportBlockProps {
  report: ReportInfo;
  projectId: string;
  project: Project;
  phase: { completed: number[]; nextPhase: number; status: Record<number, 'done' | 'partial' | 'missing'> };
  onOpenFolder: (path: string) => void;
  onPreview: (p: { type: 'image' | 'video'; url: string }) => void;
  onPlayAudio: (url: string, id: string) => void;
  playingAudio: string | null;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  contentItems: ContentItem[];
  onResume: (reportItems?: ContentItem[]) => void;
}

function ReportBlock({ report, projectId, phase, onOpenFolder, onPreview, onPlayAudio, playingAudio, onCopy, copiedId, contentItems, onResume }: ReportBlockProps) {
  const icon = report.type === 'beitrag' ? '📝' : '🎬';
  const label = report.type === 'beitrag' ? 'Beitrag' : 'Video-Script';
  // Nutze rekonstruierte Items aus dem Report, oder fallback auf persistierte ContentItems
  const effectiveItems = (report.items && report.items.length > 0) ? report.items : contentItems;

  return (
    <div className="mb-4 last:mb-0">
      {/* Report Header mit Weiter-Button */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-semibold text-[#e2e8f0] flex-1 truncate">{report.filename}</span>
        <span className="text-[10px] text-[#64748b]">({label}, {report.sections.length} Teile)</span>
        <button onClick={() => onResume(effectiveItems)}
          className="btn btn-primary btn-sm text-xs ml-2 whitespace-nowrap">
          {'▶'} Weiter ab Phase {phase.nextPhase}
          <span className="text-[10px] opacity-70 ml-1">({PHASE_LABELS[phase.nextPhase]})</span>
        </button>
        <button onClick={() => onOpenFolder(`tmp/projects/${projectId}/${report.filename}`)}
          className="text-[#7c3aed] hover:text-[#a855f7] text-sm" title="Im Explorer oeffnen">
          {'📂'}
        </button>
      </div>

      {/* Sektionen */}
      {report.sections.length > 0 && (
        <div className="ml-5 space-y-1">
          {report.sections.map((sec, idx) => {
            const matchItem = effectiveItems[idx];
            return (
              <div key={sec.number} className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-[#1a1a2e]/60">
                <span className="text-[#7c3aed] font-mono font-bold w-6 shrink-0">#{sec.number}</span>
                <span className="text-[#e2e8f0] truncate flex-1">{sec.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusChip ok={sec.hasImage} label="Bild"
                    onClick={matchItem?.imageLocalPath ? () => onPreview({
                      type: 'image', url: `/api/serve-asset?path=${encodeURIComponent(matchItem.imageLocalPath!)}`
                    }) : undefined} />
                  <StatusChip ok={sec.hasAudio} label="Audio"
                    onClick={matchItem?.voiceLocalPath ? () => onPlayAudio(
                      `/api/serve-asset?path=${encodeURIComponent(matchItem.voiceLocalPath!)}`,
                      `audio_${report.filename}_${sec.number}`
                    ) : undefined}
                    playing={playingAudio === `audio_${report.filename}_${sec.number}`} />
                  <StatusChip ok={sec.hasVideo} label="Video"
                    onClick={matchItem?.videoLocalPath ? () => onPreview({
                      type: 'video', url: `/api/serve-asset?path=${encodeURIComponent(matchItem.videoLocalPath!)}`
                    }) : undefined} />
                  <StatusChip ok={sec.hasCaption} label="Text"
                    onClick={matchItem?.caption ? () => onCopy(matchItem.caption!, `cap_${report.filename}_${sec.number}`) : undefined}
                    copied={copiedId === `cap_${report.filename}_${sec.number}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Status-Chip ────────────────────────────────────────────────────────────

function StatusChip({ ok, label, onClick, playing, copied }: {
  ok: boolean; label: string; onClick?: () => void; playing?: boolean; copied?: boolean;
}) {
  const base = ok
    ? 'text-green-400 border-green-700/40 bg-green-900/20'
    : 'text-red-400/50 border-[#2d2d44] bg-transparent';
  const interactive = ok && onClick;

  return (
    <button
      onClick={interactive ? onClick : undefined}
      disabled={!interactive}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] ${base} ${
        interactive ? 'hover:bg-green-900/40 cursor-pointer' : 'cursor-default'
      }`}
      title={ok ? `${label} ${playing ? 'stoppen' : copied ? 'kopiert!' : 'anzeigen'}` : `${label} fehlt`}
    >
      {copied ? '✓' : playing ? '■' : ok ? '✓' : '✗'}
      {' '}{label}
    </button>
  );
}

// ─── Asset Badge ────────────────────────────────────────────────────────────

function AssetBadge({ icon, count, label, color }: { icon: string; count: number; label: string; color: 'blue' | 'green' | 'orange' | 'purple' }) {
  const colors = {
    blue: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
    green: 'bg-green-900/30 text-green-300 border-green-700/30',
    orange: 'bg-orange-900/30 text-orange-300 border-orange-700/30',
    purple: 'bg-purple-900/30 text-purple-300 border-purple-700/30',
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${colors[color]}`}>
      {icon} {count} {label}
    </span>
  );
}

// ─── Content-Item Zeile ─────────────────────────────────────────────────────

function ContentItemRow({ item, index, onPreview, onPlayAudio, playingAudio, onCopy, copiedId, onOpenFolder }: {
  item: ContentItem; index: number;
  onPreview: (p: { type: 'image' | 'video'; url: string }) => void;
  onPlayAudio: (url: string, id: string) => void; playingAudio: string | null;
  onCopy: (text: string, id: string) => void; copiedId: string | null;
  onOpenFolder: (path: string) => void;
}) {
  const imageUrl = item.imageLocalPath ? `/api/serve-asset?path=${encodeURIComponent(item.imageLocalPath)}` : item.imageUrl || '';
  const audioUrl = item.voiceLocalPath ? `/api/serve-asset?path=${encodeURIComponent(item.voiceLocalPath)}` : item.voiceUrl || '';
  const videoUrl = item.videoLocalPath ? `/api/serve-asset?path=${encodeURIComponent(item.videoLocalPath)}` : item.videoUrl || '';

  return (
    <div className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-[#1a1a2e]/60 mb-1">
      <span className="text-[#7c3aed] font-mono font-bold w-6 shrink-0">#{index + 1}</span>
      <span className="text-[#e2e8f0] truncate flex-1">{item.title}</span>
      <div className="flex items-center gap-2 shrink-0">
        <StatusChip ok={!!item.imageLocalPath || !!item.imageUrl} label="Bild"
          onClick={imageUrl ? () => onPreview({ type: 'image', url: imageUrl }) : undefined} />
        <StatusChip ok={!!item.voiceLocalPath || !!item.voiceUrl} label="Audio"
          onClick={audioUrl ? () => onPlayAudio(audioUrl, `audio_item_${item.id}`) : undefined}
          playing={playingAudio === `audio_item_${item.id}`} />
        <StatusChip ok={!!item.videoLocalPath || !!item.videoUrl} label="Video"
          onClick={videoUrl ? () => onPreview({ type: 'video', url: videoUrl }) : undefined} />
        <StatusChip ok={!!(item.caption?.trim())} label="Text"
          onClick={item.caption ? () => onCopy(item.caption!, `cap_item_${item.id}`) : undefined}
          copied={copiedId === `cap_item_${item.id}`} />
      </div>
    </div>
  );
}

// ─── Flache Asset-Liste ─────────────────────────────────────────────────────

function FlatAssetList({ entry, onPreview, onPlayAudio, playingAudio }: {
  entry: ProjectExplorerData;
  onPreview: (p: { type: 'image' | 'video'; url: string }) => void;
  onPlayAudio: (url: string, id: string) => void; playingAudio: string | null;
}) {
  const assetUrl = (type: string, filename: string) =>
    `/api/serve-asset?path=${encodeURIComponent(`tmp/projects/${entry.project.id}/${type}/${filename}`)}`;

  return (
    <div>
      <p className="text-xs text-[#64748b] mb-2">Assets (ohne Bericht-Zuordnung)</p>
      {entry.assets.images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {entry.assets.images.map(img => (
            <button key={img} onClick={() => onPreview({ type: 'image', url: assetUrl('images', img) })}
              className="w-12 h-12 rounded overflow-hidden border border-[#2d2d44] hover:border-purple-500 transition">
              <img src={assetUrl('images', img)} alt={img} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {entry.assets.audios.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {entry.assets.audios.map(aud => (
            <button key={aud} onClick={() => onPlayAudio(assetUrl('audio', aud), aud)}
              className="text-[10px] px-2 py-1 rounded border border-[#2d2d44] hover:border-green-500 text-[#94a3b8]">
              {playingAudio === aud ? '■' : '▶'} {aud.substring(0, 20)}
            </button>
          ))}
        </div>
      )}
      {entry.assets.videos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.assets.videos.map(vid => (
            <button key={vid} onClick={() => onPreview({ type: 'video', url: assetUrl('videos', vid) })}
              className="text-[10px] px-2 py-1 rounded border border-[#2d2d44] hover:border-orange-500 text-[#94a3b8]">
              {'▶'} {vid.substring(0, 20)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
