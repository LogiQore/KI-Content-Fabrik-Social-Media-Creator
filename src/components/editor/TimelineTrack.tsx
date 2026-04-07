'use client';
import { useRef } from 'react';
import type { EditorTrack as EditorTrackType, EditorClip } from '@/types';
import TimelineClip from './TimelineClip';

const TRACK_COLORS: Record<string, string> = {
  media: '#3b82f6', text: '#eab308', audio: '#10b981', logo: '#94a3b8',
};

interface TimelineTrackProps {
  track: EditorTrackType;
  totalFrames: number;
  selectedClipId: string | null;
  onSelectClip: (id: string) => void;
  onMoveClip: (id: string, newStart: number) => void;
  onTrimClip: (id: string, side: 'start' | 'end', delta: number) => void;
  onRemoveClip: (id: string) => void;
  onDropClip: (trackId: string, startFrame: number, url: string, type: EditorClip['type']) => void;
}

export default function TimelineTrack({
  track, totalFrames, selectedClipId, onSelectClip, onMoveClip, onRemoveClip, onDropClip,
}: TimelineTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pxPerFrame = rect.width / totalFrames;
    const offsetPx = parseFloat(e.dataTransfer.getData('dragOffsetPx') || '0');
    const dropX = e.clientX - rect.left - offsetPx;
    const startFrame = Math.max(0, Math.round(dropX / pxPerFrame));

    // Moving existing clip?
    const clipId = e.dataTransfer.getData('clipId');
    if (clipId) { onMoveClip(clipId, startFrame); return; }

    // Dropping new asset
    const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    const type = e.dataTransfer.getData('assetType') as EditorClip['type'] || 'image';
    if (url) onDropClip(track.id, startFrame, url, type);
  };

  return (
    <div className="flex border-b border-[#2d2d44]">
      {/* Track Label */}
      <div className="w-36 flex-shrink-0 flex items-center px-3 py-2 border-r border-[#2d2d44]">
        <span className="text-xs text-[#94a3b8] truncate">{track.label}</span>
      </div>
      {/* Clip Area */}
      <div
        ref={trackRef}
        className="flex-1 relative h-10 bg-[#0f0f1a] hover:bg-[#12122a] transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {track.clips.map(clip => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            totalFrames={totalFrames}
            trackWidth={trackRef.current?.offsetWidth || 800}
            isSelected={selectedClipId === clip.id}
            trackColor={TRACK_COLORS[track.type] || '#7c3aed'}
            onSelect={onSelectClip}
            onMove={onMoveClip}
            onTrimStart={(id, d) => {}}
            onTrimEnd={(id, d) => {}}
            onRemove={onRemoveClip}
          />
        ))}
      </div>
    </div>
  );
}
