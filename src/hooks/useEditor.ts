'use client';
import { useState, useCallback } from 'react';
import type React from 'react';
import type { EditorProject, EditorTrack, EditorClip } from '@/types';

const uuidv4 = () => crypto.randomUUID();

export function useEditor(projectId: string) {
  const [editorProject, setEditorProject] = useState<EditorProject>({
    id: uuidv4(), projectId, width: 1080, height: 1080, fps: 30, durationFrames: 300, bgColor: '#000000',
    tracks: [
      { id: uuidv4(), type: 'media', label: '🟦 Video/Bild', clips: [], volume: 1 },
      { id: uuidv4(), type: 'text', label: '🟨 Text-Overlays', clips: [], volume: 1 },
      { id: uuidv4(), type: 'audio', label: '🟩 Audio', clips: [], volume: 0.8 },
      { id: uuidv4(), type: 'logo', label: '⬜ Logo', clips: [], volume: 1 },
    ],
  });
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const setDimensions = useCallback((w: number, h: number) =>
    setEditorProject(p => ({ ...p, width: w, height: h })), []);

  const addClip = useCallback((trackId: string, clip: Omit<EditorClip, 'id' | 'trackId'>) => {
    const newClip: EditorClip = { ...clip, id: uuidv4(), trackId };
    setEditorProject(p => ({
      ...p,
      tracks: p.tracks.map(t => t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t),
    }));
    // Extend total duration if needed
    const endFrame = newClip.startFrame + newClip.durationFrames;
    setEditorProject(p => endFrame > p.durationFrames ? { ...p, durationFrames: endFrame + 30 } : p);
    return newClip.id;
  }, []);

  const updateClip = useCallback((clipId: string, updates: Partial<EditorClip>) => {
    setEditorProject(p => ({
      ...p,
      tracks: p.tracks.map(t => ({
        ...t, clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates } : c),
      })),
    }));
  }, []);

  const removeClip = useCallback((clipId: string) => {
    setEditorProject(p => ({
      ...p,
      tracks: p.tracks.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== clipId) })),
    }));
    setSelectedClipId(id => id === clipId ? null : id);
  }, []);

  const moveClip = useCallback((clipId: string, newStartFrame: number) => {
    if (newStartFrame < 0) newStartFrame = 0;
    updateClip(clipId, { startFrame: newStartFrame });
  }, [updateClip]);

  const getSelectedClip = useCallback((): EditorClip | null => {
    if (!selectedClipId) return null;
    for (const track of editorProject.tracks) {
      const clip = track.clips.find(c => c.id === selectedClipId);
      if (clip) return clip;
    }
    return null;
  }, [editorProject.tracks, selectedClipId]);

  const loadContentItems = useCallback((items: import('@/types').ContentItem[]) => {
    const fps = editorProject.fps;
    const mediaTrackId = editorProject.tracks.find(t => t.type === 'media')?.id!;
    let startFrame = 0;
    items.forEach(item => {
      const dur = item.videoUrl ? fps * 10 : fps * 5;
      if (item.videoUrl || item.imageUrl) {
        addClip(mediaTrackId, {
          type: item.videoUrl ? 'video' : 'image',
          startFrame, durationFrames: dur,
          url: item.videoUrl || item.imageUrl,
          opacity: 1, scale: 1,
          transitionIn: 'fade', transitionOut: 'fade', transitionDurationFrames: 15,
        });
        startFrame += dur;
      }
    });
  }, [addClip, editorProject.fps, editorProject.tracks]);

  return {
    editorProject,
    setEditorProject: setEditorProject as React.Dispatch<React.SetStateAction<EditorProject>>,
    selectedClipId, setSelectedClipId,
    currentFrame, setCurrentFrame,
    isPlaying, setIsPlaying,
    setDimensions, addClip, updateClip, removeClip, moveClip,
    getSelectedClip, loadContentItems,
  };
}
