'use client';
import type { EditorClip } from '@/types';

interface TimelineClipProps {
  clip: EditorClip;
  totalFrames: number;
  trackWidth: number;
  isSelected: boolean;
  trackColor: string;
  onSelect: (id: string) => void;
  onMove: (id: string, newStart: number) => void;
  onTrimStart: (id: string, delta: number) => void;
  onTrimEnd: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

const TYPE_ICON: Record<string, string> = { video: '🎬', image: '🖼️', text: '💬', audio: '🎵' };

export default function TimelineClip({
  clip, totalFrames, trackWidth, isSelected, trackColor,
  onSelect, onMove, onRemove,
}: TimelineClipProps) {
  const pxPerFrame = trackWidth / totalFrames;
  const left = clip.startFrame * pxPerFrame;
  const width = Math.max(clip.durationFrames * pxPerFrame, 24);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('clipId', clip.id);
    e.dataTransfer.setData('dragOffsetPx', String(e.nativeEvent.offsetX));
  };

  const label = clip.text || clip.url?.split('/').pop()?.slice(0, 20) || clip.type;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={(e) => { e.stopPropagation(); onSelect(clip.id); }}
      className={`absolute top-1 bottom-1 rounded cursor-move flex items-center select-none transition-shadow
        ${isSelected ? 'ring-2 ring-white shadow-lg z-10' : 'hover:brightness-110'}`}
      style={{ left, width, background: trackColor, minWidth: 24 }}
    >
      {/* Trim handles */}
      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize bg-black/30 rounded-l" />
      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize bg-black/30 rounded-r" />
      {/* Content */}
      <div className="px-2 overflow-hidden flex-1 flex items-center gap-1">
        <span className="text-xs">{TYPE_ICON[clip.type]}</span>
        {width > 60 && <span className="text-xs text-white/80 truncate leading-none">{label}</span>}
      </div>
      {/* Delete on right-click */}
      <div className="absolute -top-1 -right-1 hidden group-hover:flex">
        <button onClick={(e) => { e.stopPropagation(); onRemove(clip.id); }}
          className="w-4 h-4 bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center">×</button>
      </div>
    </div>
  );
}
