'use client';
import { useState } from 'react';
const uuidv4 = () => crypto.randomUUID();
import type { Project, StrategyIdea } from '@/types';
import ContentCard from '@/components/ui/ContentCard';

const STRATEGY_MODES = [
  { value: 'einzeln', label: 'Einzelne Ideen' },
  { value: 'story', label: 'Zusammenhängende Story' },
];

interface Phase2Props { project: Project; onDone: (ideas: StrategyIdea[]) => void; }

export default function Phase2Strategy({ project, onDone }: Phase2Props) {
  const [ideas, setIdeas] = useState<StrategyIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(6);
  const [mode, setMode] = useState('einzeln');

  // ── Hook State ──
  const [hooks, setHooks] = useState<string[]>([]);
  const [selectedHook, setSelectedHook] = useState('');
  const [customHook, setCustomHook] = useState('');
  const [hooksLoading, setHooksLoading] = useState(false);
  const [hookEditing, setHookEditing] = useState(false);

  const activeHook = hookEditing ? customHook : selectedHook;

  // ── Hooks generieren ──
  const generateHooks = async () => {
    setHooksLoading(true);
    setHooks([]);
    setSelectedHook('');
    setCustomHook('');
    setHookEditing(false);
    try {
      const res = await fetch('/api/generate-hooks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name, theme: project.theme,
          audience: project.audience, platforms: project.platforms,
        }),
      });
      const data = await res.json();
      if (data.hooks?.length) setHooks(data.hooks);
    } catch (e) { console.error(e); }
    setHooksLoading(false);
  };

  // ── Strategie generieren ──
  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/strategy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name, platforms: project.platforms,
          audience: project.audience, theme: project.theme,
          userInstructions: project.userInstructions, count,
          hook: activeHook, mode,
        }),
      });
      const data = await res.json();
      if (data.ideas) setIdeas(data.ideas);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleIdea = (id: string) => setIdeas(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));
  const editIdea = (id: string, field: keyof StrategyIdea, value: string) =>
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  const deleteIdea = (id: string) => setIdeas(prev => prev.filter(i => i.id !== id));
  const addIdea = () => setIdeas(prev => [...prev, {
    id: uuidv4(), type: 'image', title: 'Neue Idee', description: '', platform: project.platforms[0],
    aspectRatio: '1:1', hashtagSuggestions: [], active: true,
  }]);

  const activeCount = ideas.filter(i => i.active).length;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#f1f5f9] mb-1">🧠 Content-Strategie</h2>
        <p className="text-[#94a3b8]">KI erstellt Content-Ideen für „{project.name}"</p>
      </div>

      {/* ── Schritt 1: Viraler Hook ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#f1f5f9]">🔥 Schritt 1: Viralen Hook wählen</h3>
            <p className="text-xs text-[#94a3b8] mt-1">Der Hook ist der erste Satz, der sofort Aufmerksamkeit erzeugt</p>
          </div>
          <button onClick={generateHooks} disabled={hooksLoading}
            className="btn btn-primary px-5 text-sm">
            {hooksLoading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generiere…</>
              : hooks.length ? '🔄 Neue Hooks' : '🔥 Hooks generieren'}
          </button>
        </div>

        {/* Hook-Karten */}
        {hooks.length > 0 && (
          <div className="space-y-2">
            {hooks.map((hook, i) => (
              <button key={i}
                onClick={() => { setSelectedHook(hook); setCustomHook(hook); setHookEditing(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm ${
                  selectedHook === hook && !hookEditing
                    ? 'border-[#7c3aed] bg-[#7c3aed]/20 text-[#f1f5f9]'
                    : 'border-[#2d2d44] bg-[#1a1a2e]/50 text-[#94a3b8] hover:border-[#7c3aed]/50 hover:text-[#f1f5f9]'
                }`}>
                <span className="font-medium text-[#a855f7] mr-2">{i + 1}.</span>
                {hook}
              </button>
            ))}

            {/* Eigenen Hook schreiben */}
            <div className="pt-2">
              <button onClick={() => { setHookEditing(true); setSelectedHook(''); }}
                className={`text-xs mb-2 ${hookEditing ? 'text-[#a855f7]' : 'text-[#94a3b8] hover:text-[#a855f7]'}`}>
                ✏️ Eigenen Hook schreiben oder anpassen
              </button>
              {hookEditing && (
                <input type="text" value={customHook}
                  onChange={e => setCustomHook(e.target.value)}
                  placeholder="Deinen eigenen Hook hier eingeben..."
                  className="w-full px-4 py-3 rounded-lg border border-[#7c3aed] bg-[#1a1a2e] text-[#f1f5f9] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]" />
              )}
            </div>
          </div>
        )}

        {activeHook && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#10b981]">✓</span>
            <span className="text-[#94a3b8]">Gewählter Hook:</span>
            <span className="text-[#f1f5f9] font-medium">„{activeHook}"</span>
          </div>
        )}
      </div>

      {/* ── Schritt 2: Strategie generieren ── */}
      <div className="card p-5 space-y-4">
        <h3 className="text-lg font-semibold text-[#f1f5f9]">🧠 Schritt 2: Strategie generieren</h3>

        <div className="flex items-center gap-3 justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#94a3b8]">Anzahl:</label>
            <select value={count} onChange={e => setCount(Number(e.target.value))} className="w-20">
              {[1,2,3,4,6,8,10,12].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-[#94a3b8]">Modus:</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className="w-56">
              {STRATEGY_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <button onClick={generate} disabled={loading} className="btn btn-primary px-6">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generiere…</> : '🧠 Strategie generieren'}
          </button>
          {ideas.length > 0 && <button onClick={addIdea} className="btn btn-ghost">+ Idee hinzufügen</button>}
        </div>

        {mode === 'story' && (
          <p className="text-xs text-[#a855f7] text-center">
            📖 Story-Modus: Generiert eine zusammenhängende Geschichte in {count} Teilen{activeHook ? `, basierend auf dem Hook` : ''}
          </p>
        )}
      </div>

      {/* ── Loading Skeleton ── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length: count}).map((_,i) => (
            <div key={i} className="card shimmer h-48 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Ideen-Grid ── */}
      {ideas.length > 0 && !loading && (
        <>
          {mode === 'story' && (
            <div className="text-center text-xs text-[#94a3b8] bg-[#1a1a2e] rounded-lg py-2 px-4">
              📖 Zusammenhängende Story — {ideas.length} Teile
              {activeHook && <> — Hook: „{activeHook}"</>}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map(idea => (
              <ContentCard key={idea.id} idea={idea} onToggle={toggleIdea} onEdit={editIdea} onDelete={deleteIdea} />
            ))}
          </div>
          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-[#94a3b8]">{activeCount} von {ideas.length} Ideen aktiv</p>
            <button onClick={() => onDone(ideas.filter(i => i.active))} disabled={activeCount === 0}
              className="btn btn-primary px-8 disabled:opacity-50">
              Weiter → {activeCount} Bilder generieren 🎨
            </button>
          </div>
        </>
      )}
    </div>
  );
}
