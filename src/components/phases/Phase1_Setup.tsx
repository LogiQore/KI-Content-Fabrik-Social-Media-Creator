'use client';
import { useState, useEffect } from 'react';
import type { Project, Platform, SocialMediaFormat, Bildstil, Avatar } from '@/types';

const ALL_PLATFORMS: { id: Platform; label: string; icon: string }[] = [
  { id: 'instagram_beitrag', label: 'Instagram Feed', icon: '📷' },
  { id: 'instagram_reels',   label: 'Instagram Reels', icon: '🎬' },
  { id: 'tiktok',            label: 'TikTok', icon: '🎵' },
  { id: 'youtube_shorts',    label: 'YouTube Shorts', icon: '▶️' },
  { id: 'youtube_video',     label: 'YouTube Video', icon: '🎥' },
  { id: 'pinterest',         label: 'Pinterest', icon: '📌' },
  { id: 'linkedin_beitrag',  label: 'LinkedIn', icon: '💼' },
];

const KATEGORIE_ICONS: Record<string, string> = {
  'Realismus': '📸', '3D & Animation': '🎮', 'Anime & Manga': '⛩️',
  'Illustration': '🎨', 'Malerisch': '🖼️', 'Spezial': '✨', 'Digital': '💻',
};

interface Phase1Props { existingProject?: Project | null; onProjectCreated: (project: Project) => void; }

export default function Phase1Setup({ existingProject, onProjectCreated }: Phase1Props) {
  const [name, setName]                 = useState(existingProject?.name || '');
  const [platforms, setPlatforms]       = useState<Platform[]>(existingProject?.platforms || ['instagram_beitrag']);
  const [audience, setAudience]         = useState(existingProject?.audience || '');
  const [theme, setTheme]               = useState(existingProject?.theme || '');
  const [toneOfVoice, setToneOfVoice]   = useState(existingProject?.toneOfVoice || 'freundlich, motivierend, authentisch');
  const [brandColors, setBrandColors]   = useState(existingProject?.brandColors?.join(', ') || '');
  const [brandFont, setBrandFont]       = useState(existingProject?.brandFont || '');
  const [userInstructions, setUserInstructions] = useState(existingProject?.userInstructions || '');
  const [bildstilId, setBildstilId]     = useState(existingProject?.bildstilId || '');
  const [avatarPath, setAvatarPath]     = useState(existingProject?.avatarPath || '');
  const [avatarName, setAvatarName]     = useState(existingProject?.avatarName || '');
  const [loading, setLoading]           = useState(false);
  const [formats, setFormats]           = useState<SocialMediaFormat[]>([]);
  const [stile, setStile]               = useState<Bildstil[]>([]);
  const [avatare, setAvatare]           = useState<Avatar[]>([]);
  const [stileFilter, setStileFilter]   = useState('alle');

  useEffect(() => {
    fetch('/api/formats').then(r => r.json()).then(d => setFormats(d.formats || []));
    fetch('/api/bildstile').then(r => r.json()).then(d => setStile(d.stile || []));
    fetch('/api/avatare').then(r => r.json()).then(d => setAvatare(d.avatare || []));
  }, []);

  const togglePlatform = (p: Platform) =>
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const kategorien = ['alle', ...Array.from(new Set(stile.map(s => s.kategorie)))];
  const filteredStile = stileFilter === 'alle' ? stile : stile.filter(s => s.kategorie === stileFilter);
  const selectedStil = stile.find(s => s.id === bildstilId);

  const [voiceOverMode, setVoiceOverMode] = useState(existingProject?.voiceOverMode || false);

  // Avatar-Auswahl-Helfer
  const selectNone      = () => { setAvatarPath(''); setAvatarName(''); };
  const selectAvatar    = (av: Avatar) => { setAvatarPath(av.path); setAvatarName(av.name); };

  const handleSubmit = async () => {
    if (!name.trim() || platforms.length === 0 || !theme.trim()) return;
    setLoading(true);
    const bildstilPrompt = selectedStil?.englisch_prompt || '';
    const payload = {
      action: existingProject ? 'update' : 'create',
      ...(existingProject
        ? { project: { ...existingProject, name, platforms, audience, theme, toneOfVoice, brandColors: brandColors.split(',').map(s => s.trim()).filter(Boolean), brandFont, userInstructions, bildstilId, bildstilPrompt, avatarPath, avatarName, voiceOverMode } }
        : { name, platforms, audience, theme, toneOfVoice, brandColors: brandColors.split(',').map(s => s.trim()).filter(Boolean), brandFont, userInstructions, bildstilId, bildstilPrompt, avatarPath, avatarName, voiceOverMode }
      ),
    };
    try {
      const res = await fetch('/api/project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      onProjectCreated(data.project);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const selectedFormats = formats.filter(f => platforms.includes(f.platform));

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#f1f5f9] mb-1">📋 Projekt einrichten</h2>
        <p className="text-[#94a3b8]">Definiere deine Kampagne, Stil und Avatare</p>
      </div>

      {/* Basis-Info */}
      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Projekt-Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Oster-Kampagne 2026" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Kampagnen-Thema / Kernbotschaft *</label>
          <textarea value={theme} onChange={e => setTheme(e.target.value)} rows={2} placeholder="Was ist das Thema? Was soll kommuniziert werden?" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Zielgruppe / Persona</label>
          <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="z.B. Frauen 25–45, Fitness-affin, Deutschland" />
        </div>
      </div>

      {/* Plattformen */}
      <div className="card">
        <label className="block text-sm font-semibold text-[#94a3b8] mb-3">🎯 Ziel-Plattformen *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ALL_PLATFORMS.map(p => {
            const fmt = formats.find(f => f.platform === p.id);
            const active = platforms.includes(p.id);
            return (
              <button key={p.id} onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all text-left
                  ${active ? 'border-purple-500 bg-purple-900/20 text-white' : 'border-[#2d2d44] text-[#94a3b8] hover:border-purple-700'}`}>
                <span className="text-lg">{p.icon}</span>
                <div>
                  <div>{p.label}</div>
                  {fmt && <div className="text-xs opacity-60">{fmt.aspectRatio} · {fmt.width}×{fmt.height}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── BILDSTIL ─────────────────────────────────────────────────────── */}
      <div className="card">
        <label className="block text-sm font-semibold text-[#94a3b8] mb-3">🎨 Bildstil</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {kategorien.map(k => (
            <button key={k} onClick={() => setStileFilter(k)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                ${stileFilter === k ? 'bg-purple-700 text-white' : 'bg-[#0f0f1a] text-[#94a3b8] hover:text-white border border-[#2d2d44]'}`}>
              {KATEGORIE_ICONS[k] || '📁'} {k}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          <button onClick={() => setBildstilId('')}
            className={`flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-all
              ${!bildstilId ? 'border-purple-500 bg-purple-900/20' : 'border-[#2d2d44] hover:border-purple-700'}`}>
            <span className="text-xl">🤷</span>
            <div><div className="font-semibold text-[#f1f5f9]">Kein Stil (Standard)</div><div className="text-xs text-[#94a3b8]">KI wählt selbst</div></div>
          </button>
          {filteredStile.map(stil => (
            <button key={stil.id} onClick={() => setBildstilId(stil.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-sm text-left transition-all
                ${bildstilId === stil.id ? 'border-purple-500 bg-purple-900/20' : 'border-[#2d2d44] hover:border-purple-700'}`}>
              <span className="text-xl">{KATEGORIE_ICONS[stil.kategorie] || '🎨'}</span>
              <div className="min-w-0">
                <div className="font-semibold text-[#f1f5f9] truncate">{stil.label}</div>
                <div className="text-xs text-[#94a3b8] truncate">{stil.beschreibung}</div>
              </div>
              {bildstilId === stil.id && <span className="ml-auto text-purple-400 flex-shrink-0">✓</span>}
            </button>
          ))}
        </div>
        {selectedStil && (
          <div className="mt-3 bg-purple-900/20 border border-purple-700/40 rounded-lg px-3 py-2">
            <p className="text-xs text-[#94a3b8] mb-0.5">📤 Prompt-Zusatz für KI:</p>
            <p className="text-xs text-purple-200 font-mono">{selectedStil.englisch_prompt}</p>
          </div>
        )}
      </div>

      {/* ─── AVATAR / CHARACTER SHEET ─────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-[#94a3b8]">🧑 Charakter / Avatar (optional)</label>
          <button onClick={() => fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderPath: './avatare' }) })}
            className="btn btn-ghost btn-sm text-xs">📁 Ordner öffnen</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Option: Kein Charakter */}
          <button onClick={selectNone}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-sm transition-all
              ${!avatarPath ? 'border-purple-500 bg-purple-900/20' : 'border-[#2d2d44] hover:border-purple-700'}`}>
            <div className="w-16 h-16 bg-[#0f0f1a] rounded-lg flex items-center justify-center text-2xl">🚫</div>
            <span className="text-xs text-[#94a3b8] text-center">Kein Charakter</span>
            {!avatarPath && <span className="text-purple-400 text-xs">✓ Gewählt</span>}
          </button>

          {/* Avatar-Bilder aus /avatare/ */}
          {avatare.map(av => (
            <button key={av.fileName} onClick={() => selectAvatar(av)}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-sm transition-all
                ${avatarPath === av.path ? 'border-purple-500 bg-purple-900/20' : 'border-[#2d2d44] hover:border-purple-700'}`}>
              <img src={av.publicUrl} alt={av.name} className="w-16 h-16 rounded-lg object-cover" />
              <span className="text-xs text-[#94a3b8] truncate w-full text-center">{av.name}</span>
              {avatarPath === av.path && <span className="text-purple-400 text-xs">✓ Gewählt</span>}
            </button>
          ))}
        </div>

        {/* Hinweis wenn noch keine Avatare vorhanden */}
        {avatare.length === 0 && (
          <p className="mt-3 text-xs text-[#94a3b8] text-center">
            Eigene Character-Sheets: PNG/JPG in <span className="font-mono text-purple-300">avatare/</span> ablegen, dann neu laden
          </p>
        )}

        {/* Voice-Over Toggle (unabhaengig vom Avatar) */}
        <div className="mt-3">
          <button onClick={() => setVoiceOverMode(!voiceOverMode)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm transition-all
              ${voiceOverMode ? 'border-blue-500 bg-blue-900/20' : 'border-[#2d2d44] hover:border-blue-700'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg flex items-center justify-center text-xl flex-shrink-0">🎙️</div>
            <div className="flex-1 text-left">
              <div className="text-xs font-semibold text-[#f1f5f9]">Voice-Over Modus</div>
              <div className="text-xs text-[#94a3b8]">Bilder werden fuer direkte Kamera-Ansprache optimiert (kombinierbar mit Avatar)</div>
            </div>
            <div className={`w-10 h-5 rounded-full flex items-center transition-all ${voiceOverMode ? 'bg-blue-500 justify-end' : 'bg-[#2d2d44] justify-start'}`}>
              <div className="w-4 h-4 bg-white rounded-full mx-0.5" />
            </div>
          </button>
        </div>

        {/* Status-Hinweise */}
        {avatarPath && (
          <p className="mt-2 text-xs text-green-400">✓ Avatar: <span className="font-semibold">{avatarName}</span> — wird als Referenzbild bei der Bildgenerierung verwendet</p>
        )}
        {voiceOverMode && (
          <div className="mt-2 bg-blue-900/20 border border-blue-700/40 rounded-lg px-3 py-2">
            <p className="text-xs text-blue-200">🎙️ Voice-Over aktiv — Bilder werden fuer Kamera-Ansprache optimiert{avatarPath ? ` (mit Avatar "${avatarName}")` : ''}</p>
          </div>
        )}
      </div>

      {/* Brand & Optionen */}
      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Tonalität / Tone of Voice</label>
          <input value={toneOfVoice} onChange={e => setToneOfVoice(e.target.value)} placeholder="z.B. freundlich, motivierend, professionell" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Brand-Farben (kommagetrennt)</label>
            <input value={brandColors} onChange={e => setBrandColors(e.target.value)} placeholder="#7c3aed, #a855f7" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#94a3b8] mb-1">Schriftart (optional)</label>
            <input value={brandFont} onChange={e => setBrandFont(e.target.value)} placeholder="Inter, Montserrat…" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#94a3b8] mb-1">⭐ Eigene Anweisungen</label>
          <textarea value={userInstructions} onChange={e => setUserInstructions(e.target.value)} rows={3}
            placeholder="Besondere Wünsche, Stil-Vorgaben, was beachtet werden soll…" />
        </div>
      </div>

      {/* Format-Tabelle */}
      {selectedFormats.length > 0 && (
        <div className="card">
          <p className="text-xs font-semibold text-[#94a3b8] mb-2">📊 Gewählte Formate</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-[#94a3b8]">
              <thead><tr className="text-left border-b border-[#2d2d44]">
                <th className="pb-1 pr-3">Plattform</th><th className="pb-1 pr-3">Format</th>
                <th className="pb-1 pr-3">Auflösung</th><th className="pb-1">Dauer</th>
              </tr></thead>
              <tbody>{selectedFormats.map(f => (
                <tr key={f.platform} className="border-b border-[#2d2d44]/50">
                  <td className="py-1 pr-3 text-[#f1f5f9]">{f.label}</td>
                  <td className="py-1 pr-3">{f.aspectRatio}</td>
                  <td className="py-1 pr-3">{f.width}×{f.height}</td>
                  <td className="py-1">{f.maxDurationSec}s</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading || !name || platforms.length === 0 || !theme}
        className="btn btn-primary w-full text-base py-3 disabled:opacity-50">
        {loading ? '⏳ Wird gespeichert…' : existingProject ? '💾 Projekt aktualisieren →' : '🚀 Projekt erstellen → Strategie'}
      </button>
    </div>
  );
}
