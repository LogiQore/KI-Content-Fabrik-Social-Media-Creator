'use client';
import { useState } from 'react';
import type { Project, ContentItem } from '@/types';
import PlatformBadge from '@/components/ui/PlatformBadge';

const MAX_CHARS: Record<string, number> = {
  instagram_beitrag: 2200, instagram_reels: 2200, tiktok: 2200,
  youtube_shorts: 5000, youtube_video: 5000, pinterest: 500, linkedin_beitrag: 3000,
};

interface Phase4Props { project: Project; items: ContentItem[]; onDone: (items: ContentItem[]) => void; }

export default function Phase4Captions({ project, items: initialItems, onDone }: Phase4Props) {
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [mdSaved, setMdSaved] = useState<string | null>(null);
  const [mdSaving, setMdSaving] = useState(false);

  const exportMd = async () => {
    setMdSaving(true); setMdSaved(null);
    try {
      const res = await fetch('/api/export-md', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, items }),
      });
      const data = await res.json();
      if (data.filePath) {
        setMdSaved(data.filePath);
        // Explorer öffnen
        fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filePath: data.filePath }) });
      }
    } catch (e) { console.error(e); }
    setMdSaving(false);
  };

  const generateCaption = async (item: ContentItem) => {
    setLoading(prev => ({ ...prev, [item.id]: true }));
    setErrors(prev => ({ ...prev, [item.id]: '' }));
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTitle: item.title,
          contentDescription: item.description,
          platform: item.platform,
          audience: project.audience,
          theme: project.theme,
          toneOfVoice: project.toneOfVoice,
          userInstructions: project.userInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.caption) {
        setItems(prev => prev.map(it =>
          it.id === item.id
            ? { ...it, caption: data.caption + (data.cta ? `\n\n${data.cta}` : ''), hashtags: data.hashtags }
            : it
        ));
      } else {
        throw new Error('Keine Caption erhalten');
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, [item.id]: String(e) }));
    }
    setLoading(prev => ({ ...prev, [item.id]: false }));
  };

  // FIX: Alle Items generieren — nicht nur leere
  const generateAll = () => items.forEach(item => generateCaption(item));

  const updateCaption = (id: string, caption: string) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, caption } : it));

  const removeTag = (id: string, tag: string) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, hashtags: it.hashtags?.filter(h => h !== tag) } : it));

  const addTag = (id: string, tag: string) => {
    if (!tag.trim()) return;
    const t = tag.startsWith('#') ? tag : `#${tag}`;
    setItems(prev => prev.map(it => it.id === id ? { ...it, hashtags: [...(it.hashtags || []), t] } : it));
  };

  const doneCount = items.filter(it => it.caption).length;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#f1f5f9] mb-1">✍️ Captions & Hashtags</h2>
        <p className="text-[#94a3b8]">KI schreibt Texte für jeden Beitrag</p>
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <button onClick={generateAll} className="btn btn-primary px-6">✨ Alle Texte generieren</button>
        {doneCount > 0 && (
          <span className="text-sm text-green-400">✓ {doneCount}/{items.length} fertig</span>
        )}
        <button onClick={exportMd} disabled={mdSaving}
          className="btn btn-ghost px-5 text-sm border border-[#2d2d44] hover:border-purple-500">
          {mdSaving ? '⏳ Speichert…' : '📄 beitrag_erstellt.md'}
        </button>
      </div>
      {mdSaved && (
        <div className="text-center text-xs text-green-400">
          ✅ Gespeichert: <span className="font-mono text-purple-300">{mdSaved}</span>
        </div>
      )}

      <div className="space-y-4">
        {items.map(item => {
          const max = MAX_CHARS[item.platform] || 2200;
          const len = (item.caption || '').length;
          const isLoading = loading[item.id];
          const errMsg   = errors[item.id];

          return (
            <div key={item.id} className="card space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlatformBadge platform={item.platform} />
                  <span className="font-semibold text-sm text-[#f1f5f9]">{item.title}</span>
                </div>
                <button onClick={() => generateCaption(item)} disabled={isLoading}
                  className="btn btn-ghost btn-sm text-xs">
                  {isLoading
                    ? <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin inline-block mr-1" />Generiere…</>
                    : '🔄 Neu generieren'}
                </button>
              </div>

              {/* Bild-Vorschau + Pfad */}
              {item.imageUrl && (
                <div className="flex items-center gap-3">
                  <img src={item.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                  {item.imageLocalPath && (
                    <button
                      onClick={() =>
                        fetch('/api/open-folder', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ filePath: item.imageLocalPath }),
                        })
                      }
                      title="Im Explorer öffnen"
                      className="group flex items-center gap-2 bg-[#0f0f1a] border border-[#2d2d44] hover:border-purple-500 rounded-lg px-3 py-2 text-left transition-colors min-w-0"
                    >
                      <span className="text-lg flex-shrink-0">📁</span>
                      <span className="text-xs text-[#94a3b8] group-hover:text-purple-300 truncate font-mono">
                        {item.imageLocalPath}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Fehlermeldung */}
              {errMsg && (
                <div className="text-xs text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                  ❌ Fehler: {errMsg}
                  <button onClick={() => generateCaption(item)} className="ml-3 underline hover:text-red-300">
                    Nochmal versuchen
                  </button>
                </div>
              )}

              {/* Caption Textarea */}
              <div>
                <div className="flex justify-between text-xs text-[#94a3b8] mb-1">
                  <span>Caption</span>
                  <span className={len > max ? 'text-red-400' : ''}>{len}/{max}</span>
                </div>
                <textarea
                  value={item.caption || ''}
                  onChange={e => updateCaption(item.id, e.target.value)}
                  rows={5}
                  placeholder={isLoading ? 'Wird generiert…' : 'Caption hier eingeben oder generieren lassen…'}
                  className={`resize-y ${isLoading ? 'opacity-50' : ''}`}
                />
              </div>

              {/* Hashtags */}
              <div>
                <p className="text-xs text-[#94a3b8] mb-2">Hashtags</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(item.hashtags || []).map(tag => (
                    <span key={tag}
                      className="flex items-center gap-1 bg-purple-900/30 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                      {tag}
                      <button onClick={() => removeTag(item.id, tag)} className="hover:text-red-400 leading-none">×</button>
                    </span>
                  ))}
                  <input
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        addTag(item.id, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    placeholder="+ Hashtag (Enter)"
                    className="text-xs w-32 bg-transparent border-none p-0 focus:ring-0 text-[#94a3b8]"
                  />
                </div>
                {/* Bearbeitbares Textfeld — alle Hashtags als Text */}
                <textarea
                  value={(item.hashtags || []).join(' ')}
                  onChange={e => {
                    const tags = e.target.value
                      .split(/[\s,]+/)
                      .map(t => t.trim())
                      .filter(t => t.length > 0)
                      .map(t => t.startsWith('#') ? t : `#${t}`);
                    setItems(prev => prev.map(it => it.id === item.id ? { ...it, hashtags: tags } : it));
                  }}
                  rows={2}
                  className="text-xs text-purple-300 bg-[#0f0f1a] border border-[#2d2d44] rounded-lg px-3 py-2 w-full resize-none font-mono focus:border-purple-500"
                  placeholder="#hashtag1 #hashtag2 #hashtag3 …"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button onClick={() => onDone(items)} className="btn btn-primary px-8">
          Weiter → Videos 🎬
        </button>
      </div>
    </div>
  );
}
