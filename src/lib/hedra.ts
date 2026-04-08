// lib/hedra.ts — Hedra API (Lipsync Character Videos)
// Base: https://api.hedra.com/web-app/public
// Auth: x-api-key Header

const BASE = 'https://api.hedra.com/web-app/public';

function getKey(): string {
  const key = process.env.HEDRA_API_KEY;
  if (!key) throw new Error('HEDRA_API_KEY nicht gesetzt');
  return key;
}

// ── Asset erstellen + Datei hochladen ──
async function uploadAsset(buffer: Buffer, fileName: string, type: 'image' | 'audio'): Promise<string> {
  // 1. Asset-Container erstellen
  const createRes = await fetch(`${BASE}/assets`, {
    method: 'POST',
    headers: { 'x-api-key': getKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: fileName, type }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Hedra asset create HTTP ${createRes.status}: ${err}`);
  }
  const { id: assetId } = await createRes.json();
  console.log(`[hedra] Asset erstellt: ${type} → ${assetId}`);

  // 2. Datei hochladen
  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(buffer)]), fileName);

  const uploadRes = await fetch(`${BASE}/assets/${assetId}/upload`, {
    method: 'POST',
    headers: { 'x-api-key': getKey() },
    body: formData,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Hedra asset upload HTTP ${uploadRes.status}: ${err}`);
  }
  console.log(`[hedra] Asset hochgeladen: ${type} ${assetId}`);
  return assetId;
}

export async function uploadImage(buffer: Buffer, fileName: string): Promise<string> {
  return uploadAsset(buffer, fileName, 'image');
}

export async function uploadAudio(buffer: Buffer, fileName: string): Promise<string> {
  return uploadAsset(buffer, fileName, 'audio');
}

// ── Lipsync-Video generieren ──
// Hedra Character 3 Model ID: d1dd37a3
export async function createGeneration(opts: {
  imageAssetId: string;
  audioAssetId: string;
  textPrompt?: string;
  aspectRatio?: string;
  modelId?: string;
}): Promise<string> {
  const ratioMap: Record<string, string> = {
    '9:16': '9:16', '16:9': '16:9', '1:1': '1:1',
    '4:5': '9:16', '2:3': '9:16',
  };

  const body: Record<string, unknown> = {
    type: 'video',
    ai_model_id: opts.modelId || 'd1dd37a3-e39a-4854-a298-6510289f9cf2',
    start_keyframe_id: opts.imageAssetId,
    generated_video_inputs: {
      text_prompt: opts.textPrompt || '',
      aspect_ratio: ratioMap[opts.aspectRatio || '9:16'] || '9:16',
      resolution: '720p',
    },
  };
  if (opts.audioAssetId) {
    body.audio_id = opts.audioAssetId;
  }

  const res = await fetch(`${BASE}/generations`, {
    method: 'POST',
    headers: { 'x-api-key': getKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hedra generation HTTP ${res.status}: ${err}`);
  }
  const json = await res.json();
  const genId = json.id || json.generation_id;
  console.log('[hedra] Generation gestartet:', genId);
  return genId;
}

// ── Generation-Status pollen ──
export async function getGenerationStatus(generationId: string): Promise<{
  state: string;
  resultUrls?: string[];
  failMsg?: string;
  progress?: number;
}> {
  const res = await fetch(`${BASE}/generations/${generationId}/status`, {
    headers: { 'x-api-key': getKey() },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Hedra poll HTTP ${res.status}: ${err}`);
  }
  const json = await res.json();

  if (json.status === 'complete' || json.status === 'completed') {
    const videoUrl = json.download_url || json.video_url || json.url;
    return { state: 'success', resultUrls: videoUrl ? [videoUrl] : [], progress: 100 };
  }
  if (json.status === 'failed' || json.status === 'error') {
    return { state: 'fail', failMsg: json.error_message || json.message || 'Hedra generation failed' };
  }
  return { state: 'generating', progress: json.progress || 50 };
}
