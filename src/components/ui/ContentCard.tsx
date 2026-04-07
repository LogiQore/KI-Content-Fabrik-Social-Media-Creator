'use client';
import type { StrategyIdea } from '@/types';
import PlatformBadge from './PlatformBadge';

interface ContentCardProps {
  idea: StrategyIdea;
  onToggle: (id: string) => void;
  onEdit: (id: string, field: keyof StrategyIdea, value: string) => void;
  onDelete: (id: string) => void;
}

const TYPE_ICON: Record<string, string> = {
  image: '🖼️', reel: '🎬', carousel: '🎠', story: '✨', video: '🎥',
};

export default function ContentCard({ idea, onToggle, onEdit, onDelete }: ContentCardProps) {
  return (
    <div className={`card transition-all ${idea.active ? 'active' : 'opacity-60'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{TYPE_ICON[idea.type] || '📱'}</span>
          <PlatformBadge platform={idea.platform} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(idea.id)}
            className={`btn btn-sm text-xs ${idea.active ? 'btn-primary' : 'btn-ghost'}`}>
            {idea.active ? '✓ Aktiv' : '○ Inaktiv'}
          </button>
          <button onClick={() => onDelete(idea.id)} className="btn btn-danger btn-sm text-xs">🗑</button>
        </div>
      </div>
      <input
        value={idea.title}
        onChange={(e) => onEdit(idea.id, 'title', e.target.value)}
        className="font-semibold text-sm mb-2 bg-transparent border-none outline-none text-[#f1f5f9] w-full p-0 focus:ring-0"
        placeholder="Titel…"
      />
      <textarea
        value={idea.description}
        onChange={(e) => onEdit(idea.id, 'description', e.target.value)}
        rows={2}
        className="text-xs text-[#94a3b8] resize-none bg-transparent border-none outline-none w-full p-0 focus:ring-0"
        placeholder="Beschreibung…"
      />
      <div className="flex flex-wrap gap-1 mt-2">
        {idea.hashtagSuggestions?.slice(0, 5).map((tag) => (
          <span key={tag} className="text-xs bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-[#94a3b8]">
        <span className="bg-[#0f0f1a] px-2 py-0.5 rounded">{idea.aspectRatio}</span>
        <span className="bg-[#0f0f1a] px-2 py-0.5 rounded capitalize">{idea.type}</span>
      </div>
    </div>
  );
}
