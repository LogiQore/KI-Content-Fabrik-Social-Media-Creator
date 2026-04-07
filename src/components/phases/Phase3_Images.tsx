'use client';
import { useState, useCallback, useRef } from 'react';
import type { Project, ContentItem, StrategyIdea } from '@/types';
import ImageCard from '@/components/ui/ImageCard';
import KieTaskProgress from '@/components/ui/KieTaskProgress';
import PlatformBadge from '@/components/ui/PlatformBadge';

const IMAGE_MODELS = [
  { value: 'nano-banana-2', label: 'Nano Banana 2 (empfohlen für Avatare)' },
  { value: 'seedream/4.5-text-to-image', label: 'Seedream 4.5' },
  { value: 'bytedance/seedream', label: 'Seedream 3.0' },
  { value: 'ideogram/v3-text-to-image', label: 'Ideogram V3' },
  { value: 'flux-2/pro-text-to-image', label: 'Flux 2 Pro' },
];

interface ItemState { taskId?: string; state: string; progress: number; imageUrl?: string; imagePrompt?: string; errorMsg?: string; }

interface Phase3Props { project: Project; ideas: StrategyIdea[]; onDone: (items: ContentItem[]) => void; onBack?: () => void; }

export default function Phase3Images({ project, ideas, onDone, onBack }: Phase3Props) {
  const [model, setModel] = useState(IMAGE_MODELS[0].value);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [items, setItems] = useState<ContentItem[]>(ideas.map(idea => ({
    id: idea.id, type: idea.type, title: idea.title, description: idea.description,
    platform: idea.platform, aspectRatio: idea.aspectRatio, active: true,
    hashtags: idea.hashtagSuggestions,
  })));
  const [describingAvatar, setDescribingAvatar] = useState(false);

  // Cache avatar description so we only fetch it once
  const avatarDescRef = useRef<string | null>(null);

  const updateItemState = (id: string, update: Partial<ItemState>) =>
    setItemStates(prev => ({ ...prev, [id]: { ...prev[id], ...update } }));

  const fetchAvatarDescription = async (): Promise<string> => {
    if (avatarDescRef.current !== null) return avatarDescRef.current;
    if (!project.avatarPath || project.avatarPath === 'voice-over' || !project.avatarName) {
      avatarDescRef.current = '';
      return '';
    }

    setDescribingAvatar(true);
    try {
      const res = await fetch('/api/describe-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarPath: project.avatarPath, avatarName: project.avatarName }),
      });
      const data = await res.json();
      avatarDescRef.current = data.description || '';
      console.log('[Phase3] Avatar-Beschreibung:', (avatarDescRef.current ?? '').slice(0, 100));
    } catch (e) {
      console.error('[Phase3] Avatar-Beschreibung fehlgeschlagen:', e);
      avatarDescRef.current = '';
    }
    setDescribingAvatar(false);
    return avatarDescRef.current ?? '';
  };

  const startPolling = useCallback((id: string, taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/poll-task?taskId=${taskId}`);
        const data = await res.json();
        const elapsed = (Date.now() - performance.now()) / 100;
        const prog = Math.min(95, Math.round(elapsed / 1.2));
        if (data.state === 'success' && data.resultUrls?.[0]) {
          clearInterval(interval);
          const dlRes = await fetch('/api/upload-asset', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: data.resultUrls[0], projectId: project.id, type: 'images' }),
          });
          const dlData = await dlRes.json();
          const remoteUrl = data.resultUrls[0];
          updateItemState(id, { state: 'success', progress: 100, imageUrl: dlData.publicPath || remoteUrl });
          setItems(prev => prev.map(it => it.id === id ? { ...it, imageUrl: dlData.publicPath || remoteUrl, imageLocalPath: dlData.localPath, imageRemoteUrl: remoteUrl } : it));
        } else if (data.state === 'fail') {
          clearInterval(interval);
          updateItemState(id, { state: 'fail', errorMsg: data.failMsg || 'Fehler' });
        } else {
          updateItemState(id, { state: data.state, progress: prog });
        }
      } catch (e) { console.error(e); }
    }, 3000);
  }, [project.id]);

  const generateImage = async (item: ContentItem, avatarDescription?: string) => {
    updateItemState(item.id, { state: 'waiting', progress: 5, imageUrl: undefined, errorMsg: undefined });
    try {
      // Fetch avatar description if not provided
      const desc = avatarDescription ?? await fetchAvatarDescription();

      const res = await fetch('/api/generate-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentTitle: item.title,
          contentDescription: item.description,
          platform: item.platform,
          aspectRatio: item.aspectRatio,
          brandStyle: project.brandColors.join(', '),
          userInstructions: project.userInstructions,
          bildstilPrompt: project.bildstilPrompt,
          avatarPath: project.avatarPath,
          avatarName: project.avatarName,
          avatarDescription: desc,
          model,
        }),
      });
      const data = await res.json();
      if (data.taskId) {
        updateItemState(item.id, { taskId: data.taskId, imagePrompt: data.imagePrompt, state: 'queuing', progress: 10 });
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, imagePrompt: data.imagePrompt, imageTaskId: data.taskId } : it));
        startPolling(item.id, data.taskId);
      } else throw new Error(data.error || 'Kein taskId');
    } catch (e) {
      updateItemState(item.id, { state: 'fail', errorMsg: String(e) });
    }
  };

  const generateAll = async () => {
    // Fetch avatar description ONCE before generating all images
    const avatarDescription = await fetchAvatarDescription();

    const pending = items.filter(item => !itemStates[item.id]?.imageUrl);
    for (let i = 0; i < pending.length; i++) {
      generateImage(pending[i], avatarDescription);
      if (i < pending.length - 1) await new Promise(r => setTimeout(r, 2500));
    }
  };
  const doneCount = items.filter(it => itemStates[it.id]?.state === 'success').length;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#f1f5f9] mb-1">🎨 Bilder generieren</h2>
        <p className="text-[#94a3b8]">{items.length} Bilder werden via kie.ai erstellt</p>
      </div>
      <div className="flex items-center gap-3 justify-center flex-wrap">
        <select value={model} onChange={e => setModel(e.target.value)} className="w-52 text-sm">
          {IMAGE_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <button onClick={generateAll} disabled={describingAvatar} className="btn btn-primary px-6">
          {describingAvatar ? '🔍 Avatar wird analysiert...' : '🚀 Alle generieren'}
        </button>
        {doneCount > 0 && <span className="text-sm text-green-400">✓ {doneCount}/{items.length} fertig</span>}
      </div>

      {describingAvatar && (
        <div className="text-center text-sm text-[#94a3b8] animate-pulse">
          Avatar wird analysiert für konsistente Darstellung...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(item => {
          const st = itemStates[item.id] || {};
          const isGenerating = ['waiting','queuing','generating'].includes(st.state);
          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <PlatformBadge platform={item.platform} />
                <span className="text-xs text-[#94a3b8] truncate">{item.title}</span>
              </div>
              <ImageCard url={st.imageUrl} title={item.title} prompt={st.imagePrompt}
                isGenerating={isGenerating} progress={st.progress || 0}
                onRegenerate={() => generateImage(item)} />
              {(isGenerating || st.state === 'fail') && (
                <KieTaskProgress state={st.state} progress={st.progress || 0}
                  taskId={st.taskId} model={model} errorMsg={st.errorMsg}
                  onRetry={() => generateImage(item)} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        {onBack && <button onClick={onBack} className="btn btn-ghost px-4">← Zurück</button>}
        <button onClick={() => onDone(items)} className="btn btn-primary px-8 ml-auto">
          Weiter → Texte & Hashtags ✍️
        </button>
      </div>
    </div>
  );
}
