'use client';
import { useState, useCallback } from 'react';
import type { Project, ContentItem } from '@/types';
import KieTaskProgress from '@/components/ui/KieTaskProgress';
import PlatformBadge from '@/components/ui/PlatformBadge';

type VideoMode = 'none' | 'image-to-video' | 'text-to-video';

const VIDEO_MODELS = [
  { value: 'veo3_fast',                label: 'Veo 3 Fast (empfohlen)',   mode: 'image-to-video' as const, duration: 8, durationFixed: true },
  { value: 'veo3',                     label: 'Veo 3 Quality',           mode: 'image-to-video' as const, duration: 8, durationFixed: true },
  { value: 'veo3_lite',                label: 'Veo 3 Lite (Budget)',     mode: 'image-to-video' as const, duration: 8, durationFixed: true },
  { value: 'kling-2.6/image-to-video', label: 'Kling 2.6 (Bild→Video)', mode: 'image-to-video' as const, duration: 5, durationFixed: false },
  { value: 'kling-2.6/text-to-video',  label: 'Kling 2.6 (Text→Video)', mode: 'text-to-video' as const,  duration: 5, durationFixed: false },
  { value: 'kling-3.0/image-to-video', label: 'Kling 3.0 (Bild→Video)', mode: 'image-to-video' as const, duration: 5, durationFixed: false },
  { value: 'kling-3.0/text-to-video',  label: 'Kling 3.0 (Text→Video)', mode: 'text-to-video' as const,  duration: 5, durationFixed: false },
];

interface VideoScript { action: string; camera: string; }

interface ItemState {
  mode: VideoMode; model: string; duration: number;
  script: VideoScript;
  scriptLoading: boolean;
  taskId?: string; taskState: string; progress: number;
  videoUrl?: string; errorMsg?: string;
  isVeo: boolean;
}

interface Phase5Props { project: Project; items: ContentItem[]; onDone: (items: ContentItem[]) => void; onBack?: () => void; }

const EMPTY_SCRIPT: VideoScript = { action: '', camera: '' };
const DEFAULT_MODEL = VIDEO_MODELS[0]; // Veo 3 Fast

function buildPrompt(s: VideoScript, fallback: string) {
  const parts = [s.action, s.camera && `Camera: ${s.camera}`].filter(Boolean);
  return parts.join('. ') || fallback;
}

export default function Phase5Video({ project, items: init, onDone, onBack }: Phase5Props) {
  const [items, setItems] = useState<ContentItem[]>(init);
  const [states, setStates] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(init.map(it => [it.id, {
      mode: 'image-to-video' as VideoMode,
      model: DEFAULT_MODEL.value,
      duration: DEFAULT_MODEL.duration,
      script: { ...EMPTY_SCRIPT },
      scriptLoading: false,
      taskState: 'idle', progress: 0,
      isVeo: true,
    }]))
  );

  const upd = (id: string, patch: Partial<ItemState>) =>
    setStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const updScript = (id: string, field: keyof VideoScript, val: string) =>
    setStates(prev => ({ ...prev, [id]: { ...prev[id], script: { ...prev[id].script, [field]: val } } }));

  const setModel = (id: string, modelValue: string) => {
    const m = VIDEO_MODELS.find(v => v.value === modelValue);
    if (!m) return;
    const isVeo = modelValue.startsWith('veo3');
    upd(id, {
      model: modelValue,
      mode: m.mode,
      duration: m.duration,
      isVeo,
    });
  };

  const generateScript = async (item: ContentItem) => {
    const st = states[item.id];
    upd(item.id, { scriptLoading: true });
    try {
      const res = await fetch('/api/generate-video-script', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title, description: item.description,
          caption: item.caption, platform: item.platform,
          theme: project.theme, mode: st.mode,
          model: st.model, duration: st.duration,
          imagePrompt: item.imagePrompt,
          avatarName: project.avatarName,
        }),
      });
      const data = await res.json();
      if (data.script) {
        upd(item.id, {
          script: { action: data.script.action || '', camera: data.script.camera || '' },
          scriptLoading: false,
        });
      } else throw new Error(data.error || 'Kein Script');
    } catch (e) { upd(item.id, { scriptLoading: false, errorMsg: String(e) }); }
  };

  const startPolling = useCallback((id: string, taskId: string, isVeo: boolean) => {
    const t0 = Date.now();
    const iv = setInterval(async () => {
      try {
        const veoParam = isVeo ? '&veo=1' : '';
        const r = await fetch(`/api/poll-task?taskId=${taskId}${veoParam}`);
        const d = await r.json();
        const prog = Math.min(95, Math.round((Date.now() - t0) / 1800));
        if (d.state === 'success' && d.resultUrls?.[0]) {
          clearInterval(iv);
          const dl = await fetch('/api/upload-asset', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: d.resultUrls[0], projectId: project.id, type: 'videos' }),
          });
          const dlData = await dl.json();
          const videoUrl = dlData.publicPath || d.resultUrls[0];
          upd(id, { taskState: 'success', progress: 100, videoUrl });
          setItems(prev => prev.map(it => it.id === id ? { ...it, videoUrl, videoLocalPath: dlData.localPath } : it));
        } else if (d.state === 'fail') {
          clearInterval(iv);
          upd(id, { taskState: 'fail', errorMsg: d.failMsg });
        } else {
          upd(id, { taskState: d.state, progress: prog });
        }
      } catch { /* ignore poll errors */ }
    }, 3000);
  }, [project.id]);

  const startVideo = async (item: ContentItem) => {
    const st = states[item.id];
    upd(item.id, { taskState: 'waiting', progress: 5, errorMsg: undefined });
    try {
      const promptText = buildPrompt(st.script, item.title)
        + '. No text, no captions, no subtitles, no watermarks, no written words of any kind.';

      const res = await fetch('/api/generate-video', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: st.mode,
          imageUrl: item.imageRemoteUrl || item.imageUrl,
          contentTitle: item.title,
          contentDescription: promptText,
          aspectRatio: item.aspectRatio,
          duration: st.duration,
          model: st.model,
        }),
      });
      const data = await res.json();
      if (data.taskId) {
        const isVeo = data.isVeo || st.isVeo;
        upd(item.id, { taskId: data.taskId, taskState: 'queuing', progress: 10, isVeo });
        startPolling(item.id, data.taskId, isVeo);
      } else throw new Error(data.error || 'Kein taskId');
    } catch (e) { upd(item.id, { taskState: 'fail', errorMsg: String(e) }); }
  };

  const generateAllScripts = async () => {
    for (const item of items) {
      if (!states[item.id].script.action && states[item.id].mode !== 'none') {
        await generateScript(item);
      }
    }
  };

  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; running: boolean }>({ current: 0, total: 0, running: false });

  const startAllVideos = async () => {
    const pending = items.filter(item => {
      const st = states[item.id];
      return st.mode !== 'none' && st.script.action && !st.videoUrl;
    });
    if (pending.length === 0) return;

    setBatchProgress({ current: 0, total: pending.length, running: true });

    for (let i = 0; i < pending.length; i++) {
      setBatchProgress({ current: i + 1, total: pending.length, running: true });
      await startVideo(pending[i]);
      if (i < pending.length - 1) await new Promise(r => setTimeout(r, 2500));
    }

    setBatchProgress(prev => ({ ...prev, running: false }));
  };

  const [mdPath, setMdPath] = useState('');
  const exportVideoScript = async () => {
    const scripts = items.map(item => {
      const st = states[item.id];
      return {
        title: item.title, platform: item.platform,
        type: item.type, aspectRatio: item.aspectRatio,
        caption: item.caption, imageLocalPath: item.imageLocalPath,
        script: st.script, model: st.model, duration: st.duration,
        videoLocalPath: item.videoLocalPath,
      };
    });
    try {
      const res = await fetch('/api/export-videoscript', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, scripts }),
      });
      const data = await res.json();
      if (data.ok) setMdPath(data.filePath);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#f1f5f9] mb-1">🎬 Videos erstellen</h2>
        <p className="text-[#94a3b8]">Fuer jeden Teil: Handlung & Kamera festlegen, dann Video generieren</p>
      </div>

      {/* Globale Aktionen */}
      <div className="flex items-center gap-3 justify-center flex-wrap">
        <button onClick={generateAllScripts} disabled={batchProgress.running} className="btn btn-ghost text-sm">
          🤖 Alle Scripts per KI generieren
        </button>
        <button onClick={startAllVideos} disabled={batchProgress.running} className="btn btn-primary text-sm px-6">
          {batchProgress.running
            ? `⏳ Video ${batchProgress.current}/${batchProgress.total} wird gestartet…`
            : '🚀 Alle Videos generieren'}
        </button>
        <button onClick={exportVideoScript} className="btn btn-ghost text-sm">
          📄 videoscript.md
        </button>
      </div>

      {/* Globaler Fortschrittsbalken */}
      {batchProgress.total > 0 && (
        <div className="max-w-xl mx-auto space-y-1">
          <div className="flex justify-between text-xs text-[#94a3b8]">
            <span>{batchProgress.running ? `Video ${batchProgress.current} von ${batchProgress.total} gestartet` : `${batchProgress.total} Videos gestartet`}</span>
            <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-[#1a1a2e] rounded-full overflow-hidden border border-[#2d2d44]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${batchProgress.running ? 'bg-purple-500 animate-pulse' : 'bg-green-500'}`}
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
          {!batchProgress.running && (
            <p className="text-center text-xs text-green-400">✅ Alle Videos wurden gestartet — Generierung laeuft im Hintergrund</p>
          )}
        </div>
      )}

      {mdPath && (
        <p className="text-center text-xs text-green-400">
          ✅ Gespeichert: <code className="text-[#94a3b8]">{mdPath}</code>
        </p>
      )}

      {/* Pro Item */}
      <div className="space-y-4">
        {items.map((item, idx) => {
          const st = states[item.id];
          const isRunning = ['waiting', 'queuing', 'generating'].includes(st.taskState);
          const modelInfo = VIDEO_MODELS.find(m => m.value === st.model);
          const durationFixed = modelInfo?.durationFixed ?? false;

          return (
            <div key={item.id} className="card space-y-3">
              {/* Header */}
              <div className="flex items-start gap-3 flex-wrap">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformBadge platform={item.platform} />
                    <span className="font-semibold text-sm truncate">{item.title}</span>
                  </div>

                  {/* Modell + Dauer Zeile */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <select value={st.model} onChange={e => setModel(item.id, e.target.value)}
                      className="text-xs w-52">
                      {VIDEO_MODELS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>

                    {durationFixed ? (
                      <span className="text-xs text-[#94a3b8] bg-[#1a1a2e] px-3 py-1.5 rounded-lg border border-[#2d2d44]">
                        ⏱ {st.duration}s (fix)
                      </span>
                    ) : (
                      <select value={st.duration} onChange={e => upd(item.id, { duration: Number(e.target.value) })}
                        className="text-xs w-20">
                        <option value={5}>5s</option>
                        <option value={10}>10s</option>
                      </select>
                    )}

                    <button onClick={() => upd(item.id, { mode: 'none' })}
                      className={`btn btn-sm text-xs ${st.mode === 'none' ? 'btn-primary' : 'btn-ghost'}`}>
                      🖼️ Nur Standbild / kein Video
                    </button>
                  </div>
                </div>

                {st.videoUrl && (
                  <video src={st.videoUrl} controls className="w-32 h-32 rounded-lg object-cover flex-shrink-0" />
                )}
              </div>

              {/* Script-Editor: 2 Felder */}
              {st.mode !== 'none' && (
                <div className="border border-[#2d2d44] rounded-xl overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f1a]">
                    <span className="text-sm font-semibold text-[#f1f5f9]">
                      📝 Video-Script — Teil {idx + 1}/{items.length}
                    </span>
                    <button onClick={() => generateScript(item)} disabled={st.scriptLoading}
                      className="btn btn-ghost btn-sm text-xs">
                      {st.scriptLoading
                        ? <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin inline-block mr-1" />KI schreibt…</>
                        : '🤖 KI-Script generieren'}
                    </button>
                  </div>

                  {/* 2 Hauptfelder */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-purple-300 mb-1">
                        🎭 Handlung & Bewegung *
                      </label>
                      <textarea value={st.script.action}
                        onChange={e => updScript(item.id, 'action', e.target.value)}
                        rows={4} className="text-sm resize-y"
                        placeholder={"Was passiert in diesem Teil? Wie bewegt sich der Charakter?\nz.B. Wauzi sitzt am Schreibtisch, dreht sich langsam zur Kamera, hebt fragend eine Augenbraue…"} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-300 mb-1">
                        🎥 Kamera & Perspektive
                      </label>
                      <textarea value={st.script.camera}
                        onChange={e => updScript(item.id, 'camera', e.target.value)}
                        rows={4} className="text-sm resize-y"
                        placeholder={"Kamerawinkel, Bewegung, Uebergang\nz.B. Nahaufnahme Gesicht, langsamer Zoom-Out, Schwenk nach rechts, Uebergang zu Teil 2…"} />
                    </div>
                  </div>

                  {/* Generieren-Button */}
                  <div className="px-4 pb-4 space-y-2">
                    <button onClick={() => startVideo(item)}
                      disabled={isRunning || !st.script.action}
                      className="btn btn-primary w-full disabled:opacity-50">
                      {isRunning ? '⏳ Video wird generiert…'
                        : st.videoUrl ? '🔄 Neu generieren'
                        : `▶ Video generieren (${st.duration}s)`}
                    </button>
                    {!st.script.action && (
                      <p className="text-xs text-[#94a3b8] text-center">
                        Bitte "Handlung & Bewegung" ausfuellen oder "🤖 KI-Script generieren" klicken
                      </p>
                    )}
                    {(isRunning || st.taskState === 'fail') && (
                      <KieTaskProgress state={st.taskState} progress={st.progress}
                        taskId={st.taskId} model={st.model} errorMsg={st.errorMsg}
                        onRetry={() => startVideo(item)} />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        {onBack && <button onClick={onBack} className="btn btn-ghost px-4">← Zurück</button>}
        <button onClick={() => onDone(items)} className="btn btn-primary px-8 ml-auto">
          Weiter → Editor ✂️
        </button>
      </div>
    </div>
  );
}
