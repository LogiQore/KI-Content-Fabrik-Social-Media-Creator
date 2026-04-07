'use client';
import { useRef, useEffect, useCallback } from 'react';
import type { EditorProject } from '@/types';

interface PreviewProps {
  editorProject: EditorProject;
  currentFrame: number;
  onFrameChange: (f: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

// ─── Globaler Asset-Cache ────────────────────────────────────────────────────
const imgCache = new Map<string, HTMLImageElement>();
const vidCache = new Map<string, HTMLVideoElement>();

function getOrLoadImage(url: string, onReady: () => void): HTMLImageElement | null {
  if (imgCache.has(url)) return imgCache.get(url)!;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => { imgCache.set(url, img); onReady(); };
  img.onerror = () => console.warn('[Preview] Image load failed:', url);
  img.src = url;
  return null; // noch nicht bereit
}

function getOrLoadVideo(url: string, onReady: () => void): HTMLVideoElement | null {
  if (vidCache.has(url)) return vidCache.get(url)!;
  const vid = document.createElement('video');
  vid.crossOrigin = 'anonymous';
  vid.muted = true;
  vid.preload = 'auto';
  vid.onloadeddata = () => { vidCache.set(url, vid); onReady(); };
  vid.onerror = () => console.warn('[Preview] Video load failed:', url);
  vid.src = url;
  return null;
}

export default function Preview({
  editorProject, currentFrame, onFrameChange, isPlaying, onPlayPause,
}: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number | null>(null);
  const frameRef  = useRef(currentFrame);
  const lastTsRef = useRef(0);

  frameRef.current = currentFrame;

  const { width, height, fps, durationFrames, tracks, bgColor } = editorProject;

  // ─── Frame zeichnen ─────────────────────────────────────────────────────────
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frame = frameRef.current;
    const redraw = () => drawFrame(); // Re-draw sobald Asset geladen

    // Hintergrund
    ctx.fillStyle = bgColor || '#000';
    ctx.fillRect(0, 0, width, height);

    // Media + Logo Tracks
    tracks.forEach(track => {
      if (track.type !== 'media' && track.type !== 'logo') return;
      track.clips.forEach(clip => {
        if (frame < clip.startFrame || frame >= clip.startFrame + clip.durationFrames) return;
        if (!clip.url) return;

        ctx.save();
        ctx.globalAlpha = clip.opacity ?? 1;

        if (clip.type === 'image') {
          const img = getOrLoadImage(clip.url, redraw);
          if (img) ctx.drawImage(img, 0, 0, width, height);
        } else if (clip.type === 'video') {
          const vid = getOrLoadVideo(clip.url, redraw);
          if (vid && vid.readyState >= 2) {
            // Zielzeit im Video berechnen
            const clipFrame = frame - clip.startFrame;
            const targetSec = clipFrame / fps;
            if (Math.abs(vid.currentTime - targetSec) > 0.15) {
              vid.currentTime = targetSec;
            }
            try { ctx.drawImage(vid, 0, 0, width, height); } catch {}
          }
        }
        ctx.restore();
      });
    });

    // Text-Overlays
    tracks.forEach(track => {
      if (track.type !== 'text') return;
      track.clips.forEach(clip => {
        if (frame < clip.startFrame || frame >= clip.startFrame + clip.durationFrames) return;
        if (!clip.text) return;
        ctx.save();
        ctx.font = `bold ${clip.fontSize ?? 48}px ${clip.fontFamily ?? 'Arial'}`;
        ctx.fillStyle = clip.color ?? '#ffffff';
        ctx.textAlign = clip.textAlign ?? 'center';
        ctx.globalAlpha = clip.opacity ?? 1;
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 10;
        ctx.fillText(clip.text, clip.posX ?? width / 2, clip.posY ?? height - 80);
        ctx.restore();
      });
    });
  }, [width, height, fps, bgColor, tracks]);

  // Frame neu zeichnen wenn sich currentFrame ändert
  useEffect(() => { drawFrame(); }, [currentFrame, drawFrame]);

  // ─── Play-Loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const step = (ts: number) => {
      if (ts - lastTsRef.current >= 1000 / fps) {
        lastTsRef.current = ts;
        const next = frameRef.current + 1 >= durationFrames ? 0 : frameRef.current + 1;
        onFrameChange(next);
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying, fps, durationFrames, onFrameChange]);

  const totalSec   = durationFrames / fps;
  const currentSec = currentFrame / fps;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const previewW = 320;
  const previewH = Math.round(previewW * height / width);

  return (
    <div className="bg-[#0f0f1a] rounded-xl overflow-hidden border border-[#2d2d44]">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: previewW, height: previewH, display: 'block', margin: '0 auto', background: '#000' }}
      />
      <div className="p-3 space-y-2">
        <input
          type="range" min={0} max={Math.max(durationFrames - 1, 1)} value={currentFrame}
          onChange={e => onFrameChange(Number(e.target.value))}
          className="w-full h-1 accent-purple-500 cursor-pointer"
        />
        <div className="flex items-center justify-between">
          <button onClick={onPlayPause} className="btn btn-primary btn-sm px-4 text-sm">
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <span className="text-xs text-[#94a3b8] font-mono">{fmt(currentSec)} / {fmt(totalSec)}</span>
        </div>
      </div>
    </div>
  );
}
