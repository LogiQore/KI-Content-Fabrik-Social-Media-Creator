'use client';
import type { Platform } from '@/types';

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; icon: string }> = {
  instagram_beitrag:  { label: 'Instagram Feed',   color: '#E1306C', icon: '📷' },
  instagram_reels:    { label: 'Instagram Reels',  color: '#833AB4', icon: '🎬' },
  tiktok:             { label: 'TikTok',           color: '#010101', icon: '🎵' },
  youtube_shorts:     { label: 'YT Shorts',        color: '#FF0000', icon: '▶️' },
  youtube_video:      { label: 'YouTube Video',    color: '#FF0000', icon: '🎥' },
  pinterest:          { label: 'Pinterest',        color: '#E60023', icon: '📌' },
  linkedin_beitrag:   { label: 'LinkedIn',         color: '#0077B5', icon: '💼' },
};

export default function PlatformBadge({ platform, size = 'sm' }: { platform: Platform; size?: 'sm' | 'md' }) {
  const cfg = PLATFORM_CONFIG[platform] || { label: platform, color: '#7c3aed', icon: '📱' };
  const padding = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${padding}`}
      style={{ background: cfg.color + '22', color: cfg.color, border: `1px solid ${cfg.color}44` }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export { PLATFORM_CONFIG };
