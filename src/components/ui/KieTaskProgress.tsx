'use client';

interface KieTaskProgressProps {
  state: string;
  progress: number;
  taskId?: string | null;
  model?: string;
  label?: string;
  onRetry?: () => void;
  errorMsg?: string;
}

export default function KieTaskProgress({ state, progress, taskId, model, label, onRetry, errorMsg }: KieTaskProgressProps) {
  const isActive = ['waiting','queuing','generating'].includes(state);
  const isFail = state === 'fail';

  const stateLabel: Record<string, string> = {
    waiting: '⏳ Warte auf Server…',
    queuing: '📋 In der Warteschlange…',
    generating: '⚡ Wird generiert…',
    success: '✅ Fertig!',
    fail: '❌ Fehler',
  };

  return (
    <div className={`rounded-xl border p-4 ${isFail ? 'border-red-500/40 bg-red-900/10' : 'border-[#2d2d44] bg-[#1a1a2e]'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-[#f1f5f9]">
          {label || '🎨 KI generiert…'}
        </span>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isActive ? 'bg-purple-900/40 text-purple-300 animate-pulse' : isFail ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
          {stateLabel[state] || state}
        </span>
      </div>

      {/* Fortschrittsbalken */}
      {(isActive || state === 'success') && (
        <div className="w-full bg-[#2d2d44] rounded-full h-2 mb-2 overflow-hidden">
          <div className={`h-2 rounded-full transition-all duration-700 ${state === 'success' ? 'bg-green-500' : 'bg-gradient-to-r from-purple-600 to-purple-400'}`}
            style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-[#94a3b8]">
          {model && <span>Modell: <span className="text-purple-300">{model}</span></span>}
          {taskId && <span className="ml-2 opacity-50">· {taskId.slice(0,8)}…</span>}
        </span>
        {isActive && <span className="text-xs text-[#94a3b8]">{progress}%</span>}
        {isFail && onRetry && (
          <button onClick={onRetry} className="btn btn-sm bg-red-700 hover:bg-red-600 text-white text-xs">
            🔄 Nochmal
          </button>
        )}
      </div>
      {isFail && errorMsg && <p className="text-xs text-red-400 mt-2 break-all">{errorMsg}</p>}
    </div>
  );
}
