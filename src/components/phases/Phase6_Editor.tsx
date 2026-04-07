'use client';
import { useState, useCallback, useEffect } from 'react';
import type { Project, ContentItem, EditorClip, EditorProject } from '@/types';
import { useEditor } from '@/hooks/useEditor';
import Preview from '@/components/editor/Preview';
import Timeline from '@/components/editor/Timeline';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import ExportPanel from '@/components/editor/ExportPanel';

interface Phase6Props { project: Project; items: ContentItem[]; onDone: () => void; }

const FORMAT_PRESETS = [
  { label: '1:1 Feed', w: 1080, h: 1080 },
  { label: '9:16 Reel', w: 1080, h: 1920 },
  { label: '16:9 YT', w: 1920, h: 1080 },
  { label: '2:3 Pin', w: 1000, h: 1500 },
];

export default function Phase6Editor({ project, items, onDone }: Phase6Props) {
  const {
    editorProject, setEditorProject,
    selectedClipId, setSelectedClipId,
    currentFrame, setCurrentFrame,
    isPlaying, setIsPlaying,
    addClip, updateClip, removeClip, moveClip,
    getSelectedClip, loadContentItems,
  } = useEditor(project.id);

  const [activePanel, setActivePanel] = useState<'properties' | 'export'>('properties');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded && items.length > 0) { setLoaded(true); loadContentItems(items); }
  }, [items, loaded, loadContentItems]);

  const handleDropAsset = useCallback((trackId: string, startFrame: number, url: string, type: EditorClip['type']) => {
    addClip(trackId, { type, url, startFrame, durationFrames: type === 'video' ? 300 : 150, opacity: 1, transitionIn: 'fade', transitionOut: 'fade', transitionDurationFrames: 15 });
  }, [addClip]);

  const handleAddText = () => {
    const textTrack = editorProject.tracks.find(t => t.type === 'text');
    if (!textTrack) return;
    addClip(textTrack.id, {
      type: 'text', startFrame: currentFrame, durationFrames: 90,
      text: 'Dein Text hier', fontFamily: 'Arial', fontSize: 64,
      color: '#ffffff', posX: editorProject.width / 2, posY: editorProject.height - 120,
      textAlign: 'center', opacity: 1, transitionIn: 'fade', transitionDurationFrames: 15,
    });
  };

  const handleAddImage = (url: string) => {
    const mediaTrack = editorProject.tracks.find(t => t.type === 'media');
    if (!mediaTrack) return;
    const lastEnd = mediaTrack.clips.reduce((mx, c) => Math.max(mx, c.startFrame + c.durationFrames), 0);
    addClip(mediaTrack.id, { type: 'image', url, startFrame: lastEnd, durationFrames: 150, opacity: 1, transitionIn: 'fade', transitionOut: 'fade', transitionDurationFrames: 15 });
  };

  const selectedClip = getSelectedClip();

  const handleUpdateProject = (updates: Partial<EditorProject>) =>
    setEditorProject((p: EditorProject) => ({ ...p, ...updates }));

  return (
    <div className="space-y-3 py-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-[#f1f5f9]">✂️ Video-Editor</h2>
        <div className="flex gap-1.5 flex-wrap">
          {FORMAT_PRESETS.map(p => (
            <button key={p.label}
              onClick={() => setEditorProject((ep: EditorProject) => ({ ...ep, width: p.w, height: p.h }))}
              className={`btn btn-sm text-xs ${editorProject.width === p.w && editorProject.height === p.h ? 'btn-primary' : 'btn-ghost'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr_240px] gap-3 items-start">
        {/* Linke Spalte: Preview + Assets */}
        <div className="space-y-3">
          <Preview
            editorProject={editorProject}
            currentFrame={currentFrame}
            onFrameChange={setCurrentFrame}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying((p: boolean) => !p)}
          />
          <div className="card">
            <p className="text-xs text-[#94a3b8] font-semibold mb-2">➕ Assets hinzufügen</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={handleAddText} className="btn btn-ghost btn-sm text-xs">💬 Text</button>
              {items.filter(it => it.imageUrl).map(it => (
                <button key={it.id} onClick={() => handleAddImage(it.imageUrl!)}
                  className="btn btn-ghost btn-sm text-xs truncate max-w-[100px]" title={it.title}>
                  🖼 {it.title.slice(0, 10)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mitte: Timeline */}
        <div className="min-w-0">
          <Timeline
            editorProject={editorProject}
            selectedClipId={selectedClipId}
            currentFrame={currentFrame}
            onSelectClip={setSelectedClipId}
            onMoveClip={moveClip}
            onRemoveClip={removeClip}
            onDropAsset={handleDropAsset}
            onFrameChange={setCurrentFrame}
          />
        </div>

        {/* Rechte Spalte: Properties / Export */}
        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl overflow-hidden">
          <div className="flex border-b border-[#2d2d44]">
            {(['properties', 'export'] as const).map(panel => (
              <button key={panel} onClick={() => setActivePanel(panel)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors
                  ${activePanel === panel ? 'bg-[#2d2d44] text-white' : 'text-[#94a3b8] hover:text-white'}`}>
                {panel === 'properties' ? '⚙️ Clip' : '📤 Export'}
              </button>
            ))}
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {activePanel === 'properties'
              ? <PropertiesPanel clip={selectedClip} editorProject={editorProject}
                  onUpdateClip={updateClip} onRemoveClip={removeClip}
                  onUpdateProject={handleUpdateProject} />
              : <ExportPanel editorProject={editorProject} projectId={project.id} />
            }
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={onDone} className="btn btn-primary px-8">
          Weiter → Export & Download 📤
        </button>
      </div>
    </div>
  );
}
