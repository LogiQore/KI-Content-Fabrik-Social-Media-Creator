'use client';
import type { EditorClip, EditorProject } from '@/types';

interface PropertiesPanelProps {
  clip: EditorClip | null;
  editorProject: EditorProject;
  onUpdateClip: (id: string, updates: Partial<EditorClip>) => void;
  onRemoveClip: (id: string) => void;
  onUpdateProject: (updates: Partial<EditorProject>) => void;
}

const FONTS = ['Arial', 'Helvetica', 'Georgia', 'Impact', 'Montserrat', 'Inter'];
const TRANSITIONS = ['none', 'fade', 'slide', 'zoom'] as const;

export default function PropertiesPanel({ clip, editorProject, onUpdateClip, onRemoveClip, onUpdateProject }: PropertiesPanelProps) {
  if (!clip) return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-sm text-[#94a3b8] uppercase tracking-wider">Projekt</h3>
      <div className="space-y-3">
        <div><label className="text-xs text-[#94a3b8] block mb-1">Hintergrundfarbe</label>
          <input type="color" value={editorProject.bgColor || '#000000'}
            onChange={e => onUpdateProject({ bgColor: e.target.value })} className="w-full h-8 cursor-pointer" /></div>
        <div><label className="text-xs text-[#94a3b8] block mb-1">FPS</label>
          <select value={editorProject.fps} onChange={e => onUpdateProject({ fps: Number(e.target.value) })} className="text-sm">
            <option value={24}>24</option><option value={30}>30</option><option value={60}>60</option>
          </select></div>
        <div className="text-xs text-[#94a3b8] bg-[#0f0f1a] rounded p-2">
          📐 {editorProject.width}×{editorProject.height} · {(editorProject.durationFrames / editorProject.fps).toFixed(1)}s
        </div>
      </div>
      <p className="text-xs text-[#94a3b8] italic mt-4">Clip anklicken zum Bearbeiten</p>
    </div>
  );

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-[#94a3b8] uppercase tracking-wider">Clip: {clip.type}</h3>
        <button onClick={() => onRemoveClip(clip.id)} className="btn btn-danger btn-sm text-xs">🗑 Löschen</button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-[#94a3b8] block mb-1">Start (Frame)</label>
            <input type="number" value={clip.startFrame} min={0}
              onChange={e => onUpdateClip(clip.id, { startFrame: Number(e.target.value) })} className="text-sm" /></div>
          <div><label className="text-xs text-[#94a3b8] block mb-1">Dauer (Frames)</label>
            <input type="number" value={clip.durationFrames} min={1}
              onChange={e => onUpdateClip(clip.id, { durationFrames: Number(e.target.value) })} className="text-sm" /></div>
        </div>
        <div><label className="text-xs text-[#94a3b8] block mb-1">Deckkraft: {Math.round((clip.opacity ?? 1) * 100)}%</label>
          <input type="range" min={0} max={1} step={0.05} value={clip.opacity ?? 1} className="w-full accent-purple-500"
            onChange={e => onUpdateClip(clip.id, { opacity: Number(e.target.value) })} /></div>

        {clip.type === 'text' && (<>
          <div><label className="text-xs text-[#94a3b8] block mb-1">Text</label>
            <textarea value={clip.text || ''} rows={2} onChange={e => onUpdateClip(clip.id, { text: e.target.value })} className="text-sm" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-[#94a3b8] block mb-1">Schrift</label>
              <select value={clip.fontFamily || 'Arial'} onChange={e => onUpdateClip(clip.id, { fontFamily: e.target.value })} className="text-sm">
                {FONTS.map(f => <option key={f}>{f}</option>)}</select></div>
            <div><label className="text-xs text-[#94a3b8] block mb-1">Größe</label>
              <input type="number" value={clip.fontSize || 48} min={8} max={200}
                onChange={e => onUpdateClip(clip.id, { fontSize: Number(e.target.value) })} className="text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-[#94a3b8] block mb-1">Farbe</label>
              <input type="color" value={clip.color || '#ffffff'} onChange={e => onUpdateClip(clip.id, { color: e.target.value })} className="w-full h-8" /></div>
            <div><label className="text-xs text-[#94a3b8] block mb-1">Ausrichtung</label>
              <select value={clip.textAlign || 'center'} onChange={e => onUpdateClip(clip.id, { textAlign: e.target.value as 'left'|'center'|'right' })} className="text-sm">
                <option value="left">Links</option><option value="center">Mitte</option><option value="right">Rechts</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-[#94a3b8] block mb-1">Pos X</label>
              <input type="number" value={clip.posX ?? 540} onChange={e => onUpdateClip(clip.id, { posX: Number(e.target.value) })} className="text-sm" /></div>
            <div><label className="text-xs text-[#94a3b8] block mb-1">Pos Y</label>
              <input type="number" value={clip.posY ?? 960} onChange={e => onUpdateClip(clip.id, { posY: Number(e.target.value) })} className="text-sm" /></div>
          </div>
        </>)}

        {(clip.type === 'audio') && (
          <div><label className="text-xs text-[#94a3b8] block mb-1">Lautstärke: {Math.round((clip.volume ?? 1) * 100)}%</label>
            <input type="range" min={0} max={1} step={0.05} value={clip.volume ?? 1} className="w-full accent-purple-500"
              onChange={e => onUpdateClip(clip.id, { volume: Number(e.target.value) })} /></div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-[#94a3b8] block mb-1">Übergang In</label>
            <select value={clip.transitionIn || 'none'} onChange={e => onUpdateClip(clip.id, { transitionIn: e.target.value as typeof clip.transitionIn })} className="text-sm">
              {TRANSITIONS.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label className="text-xs text-[#94a3b8] block mb-1">Übergang Out</label>
            <select value={clip.transitionOut || 'none'} onChange={e => onUpdateClip(clip.id, { transitionOut: e.target.value as typeof clip.transitionOut })} className="text-sm">
              {TRANSITIONS.map(t => <option key={t}>{t}</option>)}</select></div>
        </div>
      </div>
    </div>
  );
}
