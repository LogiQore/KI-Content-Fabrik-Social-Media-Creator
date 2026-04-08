'use client';
import { useState, useEffect, useRef } from 'react';
import type { Project, ContentItem, VoiceOption } from '@/types';
import PlatformBadge from '@/components/ui/PlatformBadge';

interface ItemState {
  sprechtext: string;
  textLoading: boolean;
  audioLoading: boolean;
  audioUrl?: string;
  audioLocalPath?: string;
  audioDuration?: number;
  error?: string;
}

interface Phase5Props {
  project: Project;
  items: ContentItem[];
  onDone: (items: ContentItem[]) => void;
  onBack?: () => void;
}

export default function Phase5Voice({ project, items: init, onDone, onBack }: Phase5Props) {
  const [items, setItems] = useState<ContentItem[]>(init);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<'elevenlabs' | 'did'>('elevenlabs');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  // ── Presets (localStorage) ──
  interface VoicePreset {
    name: string;
    voiceId: string;
    voiceName: string;
    stimmung: string;
    settings: { stability: number; similarityBoost: number; style: number; speed: number };
  }
  const PRESETS_KEY = 'voice_presets';
  const LAST_PRESET_KEY = 'voice_last_preset';

  const loadPresets = (): VoicePreset[] => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]'); } catch { return []; }
  };
  const loadLastPreset = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(LAST_PRESET_KEY) || '';
  };

  const [presets, setPresets] = useState<VoicePreset[]>(loadPresets);
  const [voiceSettings, setVoiceSettings] = useState({ stability: 0.4, similarityBoost: 0.75, style: 0.2, speed: 1.0 });
  const [stimmung, setStimmung] = useState('');
  const [stimmungTestLoading, setStimmungTestLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState('');

  // Letztes Preset beim Start laden
  const lastPresetApplied = useRef(false);
  useEffect(() => {
    if (lastPresetApplied.current || voices.length === 0) return;
    const lastName = loadLastPreset();
    const all = loadPresets();
    const preset = lastName ? all.find(p => p.name === lastName) : all[0];
    if (preset && voices.find(v => v.id === preset.voiceId)) {
      setSelectedVoice(preset.voiceId);
      setSelectedProvider('elevenlabs');
      setStimmung(preset.stimmung);
      setVoiceSettings(preset.settings);
      lastPresetApplied.current = true;
    }
  }, [voices]);

  const savePreset = () => {
    const voiceObj = voices.find(v => v.id === selectedVoice);
    if (!voiceObj) return;
    const name = `${voiceObj.name} — ${stimmung || 'Standard'}`;
    const preset: VoicePreset = {
      name, voiceId: selectedVoice, voiceName: voiceObj.name,
      stimmung, settings: { ...voiceSettings },
    };
    const updated = [...presets.filter(p => p.name !== name), preset];
    setPresets(updated);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
    localStorage.setItem(LAST_PRESET_KEY, name);
  };

  const applyPreset = (preset: VoicePreset) => {
    setSelectedVoice(preset.voiceId);
    setSelectedProvider('elevenlabs');
    setStimmung(preset.stimmung);
    setVoiceSettings(preset.settings);
    localStorage.setItem(LAST_PRESET_KEY, preset.name);
  };

  const deletePreset = (name: string) => {
    const updated = presets.filter(p => p.name !== name);
    setPresets(updated);
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  };

  const [states, setStates] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(init.map(it => [it.id, {
      sprechtext: it.sprechtext || '',
      textLoading: false,
      audioLoading: false,
      audioUrl: it.voiceUrl,
      audioLocalPath: it.voiceLocalPath,
      audioDuration: it.voiceDuration,
    }]))
  );

  // Stimmen laden
  useEffect(() => {
    fetch('/api/voices')
      .then(r => r.json())
      .then(d => {
        setVoices(d.voices || []);
        if (d.voices?.length > 0) setSelectedVoice(d.voices[0].id);
      })
      .catch(e => console.error('[Voice] Stimmen laden:', e))
      .finally(() => setVoicesLoading(false));
  }, []);

  const upd = (id: string, patch: Partial<ItemState>) =>
    setStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  // ── KI-Sprechtext generieren ──
  const generateText = async (item: ContentItem, idx: number) => {
    upd(item.id, { textLoading: true, error: undefined });
    try {
      const res = await fetch('/api/generate-sprechtext', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          caption: item.caption,
          description: item.description,
          platform: item.platform,
          theme: project.theme,
          sceneIndex: idx,
          totalScenes: items.length,
          stimmung: stimmung || undefined,
        }),
      });
      const data = await res.json();
      if (data.sprechtext) {
        upd(item.id, { sprechtext: data.sprechtext, textLoading: false });
      } else throw new Error(data.error || 'Kein Text');
    } catch (e) {
      upd(item.id, { textLoading: false, error: String(e) });
    }
  };

  const generateAllTexts = async () => {
    for (let i = 0; i < items.length; i++) {
      if (!states[items[i].id].sprechtext) {
        await generateText(items[i], i);
      }
    }
  };

  // ── Audio generieren (ElevenLabs TTS) ──
  const generateAudio = async (item: ContentItem) => {
    const st = states[item.id];
    if (!st.sprechtext || !selectedVoice) return;
    upd(item.id, { audioLoading: true, error: undefined });
    try {
      const voice = voices.find(v => v.id === selectedVoice);
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: st.sprechtext,
          voiceId: selectedVoice,
          projectId: project.id,
          provider: voice?.provider || 'elevenlabs',
          language: 'de',
          voiceSettings,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        upd(item.id, {
          audioLoading: false,
          audioUrl: data.publicPath,
          audioLocalPath: data.localPath,
          audioDuration: data.duration,
        });
        setItems(prev => prev.map(it => it.id === item.id ? {
          ...it,
          sprechtext: st.sprechtext,
          voiceId: selectedVoice,
          voiceProvider: voice?.provider || 'elevenlabs',
          voiceUrl: data.publicPath,
          voiceLocalPath: data.localPath,
          voiceDuration: data.duration,
        } : it));
      } else throw new Error(data.error || 'Audio-Fehler');
    } catch (e) {
      upd(item.id, { audioLoading: false, error: String(e) });
    }
  };

  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; running: boolean }>({ current: 0, total: 0, running: false });

  const generateAllAudio = async () => {
    const pending = items.filter(it => states[it.id].sprechtext && !states[it.id].audioUrl);
    if (pending.length === 0) return;
    setBatchProgress({ current: 0, total: pending.length, running: true });
    for (let i = 0; i < pending.length; i++) {
      setBatchProgress({ current: i + 1, total: pending.length, running: true });
      await generateAudio(pending[i]);
      if (i < pending.length - 1) await new Promise(r => setTimeout(r, 1000));
    }
    setBatchProgress(prev => ({ ...prev, running: false }));
  };

  // ── Probehoeren ──
  const proxyUrl = (url: string) => {
    // Externe URLs ueber Proxy leiten wegen COEP Header
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return `/api/proxy-audio?url=${encodeURIComponent(url)}`;
    }
    return url; // Lokale URLs direkt verwenden
  };

  const playPreview = (url: string, id: string) => {
    if (audioRef.current) { audioRef.current.pause(); }
    if (previewPlaying === id) { setPreviewPlaying(''); return; }
    const audio = new Audio(proxyUrl(url));
    audioRef.current = audio;
    setPreviewPlaying(id);
    audio.play().catch(e => console.error('Audio play error:', e));
    audio.onended = () => setPreviewPlaying('');
  };

  // ── onDone: Items mit Voice-Daten weiterreichen ──
  const handleDone = () => {
    const updated = items.map(it => {
      const st = states[it.id];
      return {
        ...it,
        sprechtext: voiceEnabled ? st.sprechtext : undefined,
        voiceId: voiceEnabled ? selectedVoice : undefined,
        voiceProvider: voiceEnabled ? selectedProvider : undefined,
        voiceUrl: voiceEnabled ? st.audioUrl : undefined,
        voiceLocalPath: voiceEnabled ? st.audioLocalPath : undefined,
        voiceDuration: voiceEnabled ? st.audioDuration : undefined,
      };
    });
    onDone(updated);
  };

  const doneCount = items.filter(it => states[it.id]?.audioUrl).length;
  const selectedVoiceObj = voices.find(v => v.id === selectedVoice);

  // Eigene Stimme (fest konfiguriert)
  const MY_VOICE_ID = 'p9WPpO8nCwpUwzAG1TF7';
  const myVoice = voices.find(v => v.id === MY_VOICE_ID);

  // Favoriten (localStorage)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      return new Set(JSON.parse(localStorage.getItem('voice_favorites') || '[]'));
    } catch { return new Set(); }
  });
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('voice_favorites', JSON.stringify([...next]));
      return next;
    });
  };

  // Stimmen sortieren: Favoriten zuerst, dann alphabetisch
  const elVoices = voices
    .filter(v => v.provider === 'elevenlabs' && v.id !== MY_VOICE_ID)
    .sort((a, b) => {
      const af = favorites.has(a.id) ? 0 : 1;
      const bf = favorites.has(b.id) ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#f1f5f9] mb-1">🎤 Voice & Sprechtext</h2>
        <p className="text-[#94a3b8]">Stimme auswaehlen und Sprechtexte pro Szene festlegen</p>
      </div>

      {/* Voice On/Off Toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`btn text-sm px-6 ${voiceEnabled ? 'btn-primary' : 'btn-ghost'}`}
        >
          {voiceEnabled ? '🎤 Voice-Over aktiviert' : '🔇 Ohne Voice-Over'}
        </button>
      </div>

      {voiceEnabled && (
        <>
          {/* Gespeicherte Presets */}
          {presets.length > 0 && (
            <div className="card space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-[#f1f5f9]">💾 Gespeicherte Voreinstellungen</h3>
              </div>
              <div className="space-y-1">
                {presets.map(p => {
                  const isActive = selectedVoice === p.voiceId && stimmung === p.stimmung;
                  return (
                    <div key={p.name}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all
                        ${isActive ? 'bg-purple-900/50 border border-purple-500' : 'bg-[#0f0f1a] border border-transparent hover:border-[#2d2d44]'}`}
                      onClick={() => applyPreset(p)}
                    >
                      <span className="text-sm">🎤</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#f1f5f9] font-semibold">{p.voiceName}</span>
                        <span className="text-xs text-purple-400 ml-2">— {p.stimmung || 'Standard'}</span>
                        <span className="text-xs text-[#94a3b8] ml-2">
                          (Stab. {Math.round(p.settings.stability * 100)}% · Stil {Math.round(p.settings.style * 100)}% · {p.settings.speed.toFixed(1)}x)
                        </span>
                      </div>
                      {isActive && <span className="text-xs text-purple-400">✓ Aktiv</span>}
                      <button onClick={e => { e.stopPropagation(); deletePreset(p.name); }}
                        className="text-xs text-[#94a3b8] hover:text-red-400 flex-shrink-0">✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Eigene Stimme */}
          {myVoice && (
            <div className="card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🎤</span>
                  <div>
                    <p className="font-semibold text-sm text-[#f1f5f9]">
                      {myVoice.name} — <span className="text-purple-400">elevenlabs.io</span>
                    </p>
                    <p className="text-xs text-[#94a3b8]">Deine eigene Stimme</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {myVoice.previewUrl && (
                    <button onClick={() => playPreview(myVoice.previewUrl!, 'my-voice')}
                      className="btn btn-ghost btn-sm text-xs">
                      {previewPlaying === 'my-voice' ? '⏹ Stopp' : '▶ Probehoeren'}
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedVoice(MY_VOICE_ID); setSelectedProvider('elevenlabs'); }}
                    className={`btn btn-sm text-xs ${selectedVoice === MY_VOICE_ID ? 'btn-primary' : 'btn-ghost border border-purple-500'}`}
                  >
                    {selectedVoice === MY_VOICE_ID ? '✓ Ausgewaehlt' : 'Auswaehlen'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stimmen-Auswahl */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-sm text-[#f1f5f9]">Stimme waehlen</h3>

            {voicesLoading ? (
              <p className="text-sm text-[#94a3b8] animate-pulse">Stimmen werden geladen...</p>
            ) : voices.length === 0 ? (
              <p className="text-sm text-red-400">Keine Stimmen gefunden. Bitte ELEVENLABS_API_KEY in .env.local pruefen.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {elVoices.map(v => {
                  const isSelected = selectedVoice === v.id;
                  const isFav = favorites.has(v.id);
                  return (
                    <div key={v.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                        ${isSelected ? 'bg-purple-900/50 border border-purple-500' : 'bg-[#0f0f1a] border border-transparent hover:border-[#2d2d44]'}`}
                      onClick={() => { setSelectedVoice(v.id); setSelectedProvider('elevenlabs'); }}
                    >
                      {/* Favorit-Stern */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleFavorite(v.id); }}
                        className={`text-sm flex-shrink-0 ${isFav ? 'text-yellow-400' : 'text-[#2d2d44] hover:text-yellow-400'}`}
                        title={isFav ? 'Favorit entfernen' : 'Als Favorit markieren'}
                      >
                        {isFav ? '★' : '☆'}
                      </button>

                      {/* Name + Kategorie */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[#f1f5f9]">{v.name}</span>
                        <span className="text-xs text-[#94a3b8] ml-2">({v.category})</span>
                      </div>

                      {/* Probehoeren */}
                      {v.previewUrl && (
                        <button
                          onClick={e => { e.stopPropagation(); playPreview(v.previewUrl!, v.id); }}
                          className="btn btn-ghost btn-sm text-xs flex-shrink-0"
                        >
                          {previewPlaying === v.id ? '⏹' : '▶'}
                        </button>
                      )}

                      {/* Ausgewaehlt */}
                      {isSelected && <span className="text-xs text-purple-400 flex-shrink-0">✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stimmung & Voice-Settings */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-sm text-[#f1f5f9]">Stimmung & Stimm-Einstellungen</h3>

            {/* Stimmungs-Vorgabe fuer KI-Sprechtext */}
            <div>
              <label className="block text-xs font-semibold text-purple-300 mb-1">🎭 Stimmung / Emotion (fuer KI-Sprechtext)</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {['', 'dramatisch & eindringlich', 'warm & einfuehlsam', 'energisch & motivierend', 'ruhig & nachdenklich', 'provokant & direkt', 'geheimnisvoll & spannend'].map(s => (
                  <button key={s} onClick={() => setStimmung(s)}
                    className={`text-xs px-3 py-1 rounded-full border transition-all
                      ${stimmung === s ? 'border-purple-500 bg-purple-900/30 text-purple-300' : 'border-[#2d2d44] text-[#94a3b8] hover:border-purple-700'}`}>
                    {s || 'Standard'}
                  </button>
                ))}
              </div>
              <input type="text" value={stimmung} onChange={e => setStimmung(e.target.value)}
                placeholder="Eigene Stimmung eingeben, z.B. 'fluesternd und bedrohlich'"
                className="text-xs w-full" />
              <p className="text-xs text-[#94a3b8] mt-1">Beeinflusst wie der KI-Sprechtext formuliert wird (Satzzeichen, Pausen, Wortwahl). ElevenLabs interpretiert Emotion aus dem Text.</p>
              <button
                onClick={async () => {
                  if (!selectedVoice) return;
                  setStimmungTestLoading(true);
                  try {
                    // KI generiert kurzen Demo-Satz in der gewaehlten Stimmung
                    const textRes = await fetch('/api/generate-sprechtext', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: project.theme || 'Social Media Content',
                        caption: '', description: '', platform: project.platforms?.[0] || 'tiktok',
                        theme: project.theme, sceneIndex: 0, totalScenes: 1,
                        stimmung: stimmung || 'Standard',
                      }),
                    });
                    const textData = await textRes.json();
                    if (!textData.sprechtext) throw new Error('Kein Text');

                    // Audio mit aktuellen Settings generieren
                    const audioRes = await fetch('/api/generate-voice', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        text: textData.sprechtext, voiceId: selectedVoice, projectId: project.id,
                        provider: 'elevenlabs', language: 'de', voiceSettings,
                      }),
                    });
                    const audioData = await audioRes.json();
                    if (audioData.publicPath) {
                      playPreview(audioData.publicPath, 'stimmung-test');
                    } else throw new Error(audioData.error || 'Audio-Fehler');
                  } catch (e) { console.error('Stimmung-Test:', e); }
                  setStimmungTestLoading(false);
                }}
                disabled={stimmungTestLoading || !selectedVoice}
                className="btn btn-ghost btn-sm text-xs mt-2"
              >
                {stimmungTestLoading ? '⏳ Wird generiert...' : '🎧 Stimmung probehoeren'}
              </button>
              <button
                onClick={() => { savePreset(); }}
                disabled={!selectedVoice}
                className="btn btn-ghost btn-sm text-xs mt-2 ml-2"
              >
                💾 Einstellung speichern
              </button>
            </div>

            {/* Voice-Regler */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">
                  Stabilitaet: <span className="text-[#f1f5f9] font-mono">{Math.round(voiceSettings.stability * 100)}%</span>
                </label>
                <input type="range" min="0" max="100" value={Math.round(voiceSettings.stability * 100)}
                  onChange={e => setVoiceSettings(prev => ({ ...prev, stability: Number(e.target.value) / 100 }))}
                  className="w-full accent-purple-500" />
                <p className="text-xs text-[#94a3b8] mt-0.5">Niedrig = mehr Emotion</p>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">
                  Aehnlichkeit: <span className="text-[#f1f5f9] font-mono">{Math.round(voiceSettings.similarityBoost * 100)}%</span>
                </label>
                <input type="range" min="0" max="100" value={Math.round(voiceSettings.similarityBoost * 100)}
                  onChange={e => setVoiceSettings(prev => ({ ...prev, similarityBoost: Number(e.target.value) / 100 }))}
                  className="w-full accent-purple-500" />
                <p className="text-xs text-[#94a3b8] mt-0.5">Naeher an Original</p>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">
                  Stil: <span className="text-[#f1f5f9] font-mono">{Math.round(voiceSettings.style * 100)}%</span>
                </label>
                <input type="range" min="0" max="100" value={Math.round(voiceSettings.style * 100)}
                  onChange={e => setVoiceSettings(prev => ({ ...prev, style: Number(e.target.value) / 100 }))}
                  className="w-full accent-purple-500" />
                <p className="text-xs text-[#94a3b8] mt-0.5">Verstaerkt Sprecher-Stil</p>
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">
                  Tempo: <span className="text-[#f1f5f9] font-mono">{voiceSettings.speed.toFixed(1)}x</span>
                </label>
                <input type="range" min="50" max="200" value={Math.round(voiceSettings.speed * 100)}
                  onChange={e => setVoiceSettings(prev => ({ ...prev, speed: Number(e.target.value) / 100 }))}
                  className="w-full accent-purple-500" />
                <p className="text-xs text-[#94a3b8] mt-0.5">0.5x langsam — 2.0x schnell</p>
              </div>
            </div>
          </div>

          {/* Globale Aktionen */}
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <button onClick={generateAllTexts} className="btn btn-ghost text-sm">
              🤖 Alle Sprechtexte per KI
            </button>
            <button
              onClick={generateAllAudio}
              disabled={batchProgress.running || !selectedVoice}
              className="btn btn-primary text-sm px-6"
            >
              {batchProgress.running
                ? `⏳ Audio ${batchProgress.current}/${batchProgress.total}...`
                : '🔊 Alle Audios generieren'}
            </button>
            {doneCount > 0 && (
              <span className="text-sm text-green-400">✓ {doneCount}/{items.length} Audios fertig</span>
            )}
          </div>

          {/* Fortschrittsbalken */}
          {batchProgress.total > 0 && (
            <div className="max-w-xl mx-auto space-y-1">
              <div className="flex justify-between text-xs text-[#94a3b8]">
                <span>{batchProgress.running ? `Audio ${batchProgress.current}/${batchProgress.total}` : `${batchProgress.total} Audios generiert`}</span>
                <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-[#1a1a2e] rounded-full overflow-hidden border border-[#2d2d44]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${batchProgress.running ? 'bg-purple-500 animate-pulse' : 'bg-green-500'}`}
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Pro Szene */}
          <div className="space-y-4">
            {items.map((item, idx) => {
              const st = states[item.id];
              return (
                <div key={item.id} className="card space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PlatformBadge platform={item.platform} />
                        <span className="font-semibold text-sm truncate">Teil {idx + 1}/{items.length}: {item.title}</span>
                      </div>
                    </div>
                    {st.audioUrl && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => playPreview(st.audioUrl!, item.id)}
                          className="btn btn-ghost btn-sm text-xs"
                        >
                          {previewPlaying === item.id ? '⏹ Stopp' : '▶ Abspielen'}
                        </button>
                        <span className="text-xs text-green-400">✅ {st.audioDuration}s</span>
                      </div>
                    )}
                  </div>

                  {/* Sprechtext */}
                  <div>
                    <label className="block text-xs font-semibold text-purple-300 mb-1">
                      🎤 Sprechtext — Szene {idx + 1}
                    </label>
                    <textarea
                      value={st.sprechtext}
                      onChange={e => upd(item.id, { sprechtext: e.target.value })}
                      rows={3}
                      className="text-sm resize-y"
                      placeholder="Was soll gesprochen werden? z.B. 'Du hast heute mit einem Manipulator gesprochen... und es nicht gemerkt.'"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[#94a3b8]">
                        {st.sprechtext.split(/\s+/).filter(Boolean).length} Woerter
                        {st.sprechtext.length > 0 && ` · ~${Math.round(st.sprechtext.split(/\s+/).filter(Boolean).length / 2.5)}s`}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => generateText(item, idx)}
                          disabled={st.textLoading}
                          className="btn btn-ghost btn-sm text-xs"
                        >
                          {st.textLoading ? '⏳ KI schreibt...' : '🤖 KI-Text'}
                        </button>
                        <button
                          onClick={() => generateAudio(item)}
                          disabled={st.audioLoading || !st.sprechtext || !selectedVoice}
                          className="btn btn-primary btn-sm text-xs"
                        >
                          {st.audioLoading ? '⏳ Generiert...' : '🔊 Audio erstellen'}
                        </button>
                      </div>
                    </div>
                    {st.error && <p className="text-xs text-red-400 mt-1">{st.error}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        {onBack && <button onClick={onBack} className="btn btn-ghost px-4">← Zurueck</button>}
        <button onClick={handleDone} className="btn btn-primary px-8 ml-auto">
          {voiceEnabled ? 'Weiter → Videos 🎬' : 'Ohne Voice → Videos 🎬'}
        </button>
      </div>
    </div>
  );
}
