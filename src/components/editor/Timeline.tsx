'use client';
import type { EditorProject, EditorClip } from '@/types';
import TimelineTrack from './TimelineTrack';

interface TimelineProps {
  editorProject: EditorProject;
  selectedClipId: string | null;
  currentFrame: number;
  onSelectClip: (id: string) => void;
  onMoveClip: (id: string, frame: number) => void;
  onRemoveClip: (id: string) => void;
  onDropAsset: (trackId: string, frame: number, url: string, type: EditorClip['type']) => void;
  onFrameChange: (f: number) => void;
}

export default function Timeline({
  editorProject, selectedClipId, currentFrame,
  onSelectClip, onMoveClip, onRemoveClip, onDropAsset, onFrameChange,
}: TimelineProps) {
  const { tracks, durationFrames, fps } = editorProject;
  const totalSec = durationFrames / fps;

  // Generate tick marks every second
  const ticks = Array.from({ length: Math.ceil(totalSec) + 1 }, (_, i) => i);

  return (
    <div className="bg-[#0f0f1a] border border-[#2d2d44] rounded-xl overflow-hidden">
      {/* Ruler */}
      <div className="flex border-b border-[#2d2d44]">
        <div className="w-36 flex-shrink-0 border-r border-[#2d2d44] bg-[#1a1a2e] px-3 py-1">
          <span className="text-xs text-[#94a3b8]">Timeline</span>
        </div>
        <div className="flex-1 relative h-6 overflow-hidden">
          {ticks.map(sec => (
            <div key={sec} className="absolute flex flex-col items-center" style={{ left: `${(sec / totalSec) * 100}%` }}>
              <div className="w-px h-3 bg-[#2d2d44]" />
              <span className="text-[9px] text-[#94a3b8]">{sec}s</span>
            </div>
          ))}
          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-purple-500 z-10 pointer-events-none"
            style={{ left: `${(currentFrame / durationFrames) * 100}%` }} />
        </div>
      </div>

      {/* Tracks */}
      <div className="relative">
        {tracks.map(track => (
          <TimelineTrack
            key={track.id}
            track={track}
            totalFrames={durationFrames}
            selectedClipId={selectedClipId}
            onSelectClip={onSelectClip}
            onMoveClip={onMoveClip}
            onTrimClip={() => {}}
            onRemoveClip={onRemoveClip}
            onDropClip={(tid, frame, url, type) => onDropAsset(tid, frame, url, type)}
          />
        ))}
        {/* Playhead overlay */}
        <div className="absolute top-0 bottom-0 w-px bg-purple-500/70 pointer-events-none z-10"
          style={{ left: `calc(144px + ${(currentFrame / durationFrames) * (100 - 0)}%)` }} />
      </div>
    </div>
  );
}
