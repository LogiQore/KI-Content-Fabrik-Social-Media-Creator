'use client';

interface ImageCardProps {
  url?: string;
  localPath?: string;
  title: string;
  prompt?: string;
  isGenerating?: boolean;
  progress?: number;
  onRegenerate?: () => void;
  onDelete?: () => void;
  selected?: boolean;
  onClick?: () => void;
}

export default function ImageCard({ url, title, prompt, isGenerating, progress = 0, onRegenerate, onDelete, selected, onClick }: ImageCardProps) {
  const displayUrl = url;
  return (
    <div onClick={onClick}
      className={`card cursor-pointer transition-all ${selected ? 'active' : ''} ${onClick ? 'hover:scale-[1.02]' : ''}`}>
      <div className="aspect-square rounded-lg overflow-hidden bg-[#0f0f1a] relative mb-3">
        {displayUrl ? (
          <img src={displayUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isGenerating ? (
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs text-[#94a3b8]">{progress}%</span>
              </div>
            ) : (
              <span className="text-4xl opacity-30">🖼️</span>
            )}
          </div>
        )}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
              <span className="text-xs text-white">{progress}%</span>
            </div>
          </div>
        )}
      </div>
      <p className="text-sm font-semibold text-[#f1f5f9] truncate mb-1">{title}</p>
      {prompt && <p className="text-xs text-[#94a3b8] line-clamp-2 mb-3">{prompt}</p>}
      <div className="flex gap-2">
        {onRegenerate && (
          <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
            className="btn btn-ghost btn-sm flex-1 text-xs" disabled={isGenerating}>
            🔄 Neu
          </button>
        )}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="btn btn-danger btn-sm text-xs" disabled={isGenerating}>
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
