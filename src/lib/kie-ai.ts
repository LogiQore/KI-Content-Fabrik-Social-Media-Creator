// lib/kie-ai.ts — Alle Model-Strings aus der offiziellen Doku (docs.kie.ai, April 2026)
// Endpoint: POST https://api.kie.ai/api/v1/jobs/createTask
// Poll:     GET  https://api.kie.ai/api/v1/jobs/recordInfo?taskId=...

const KIE_BASE = 'https://api.kie.ai';
const KIE_UPLOAD_BASE = 'https://kieai.redpandaai.co';
const CREATE_TASK_URL = `${KIE_BASE}/api/v1/jobs/createTask`;
const POLL_URL = `${KIE_BASE}/api/v1/jobs/recordInfo`;

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.KIE_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

// ─── Task erstellen (Retry bei 429) ─────────────────────────────────────────
export async function createTask(model: string, input: Record<string, unknown>, callBackUrl?: string): Promise<string> {
  const body: Record<string, unknown> = { model, input };
  if (callBackUrl) body.callBackUrl = callBackUrl;
  for (let i = 0; i < 3; i++) {
    const res = await fetch(CREATE_TASK_URL, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) });
    if (res.status === 429) { await sleep(2000 * (i + 1)); continue; }
    if (!res.ok) { const t = await res.text(); throw new Error(`KIE HTTP ${res.status}: ${t}`); }
    const json = await res.json();
    if (json.code !== 200) throw new Error(`KIE error ${json.code}: ${json.msg}`);
    return json.data.taskId as string;
  }
  throw new Error('Rate limit: max retries exceeded');
}

// ─── Task-Status pollen ──────────────────────────────────────────────────────
export async function pollTask(taskId: string, timeoutMs = 600_000): Promise<string[]> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(3000);
    const res = await fetch(`${POLL_URL}?taskId=${taskId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Poll HTTP ${res.status}`);
    const json = await res.json();
    const data = json.data;
    if (data.state === 'success') {
      const result = JSON.parse(data.resultJson || '{}');
      return (result.resultUrls || []) as string[];
    }
    if (data.state === 'fail') throw new Error(`Task failed: ${data.failMsg}`);
  }
  throw new Error('Task timeout');
}

// ─── Einzel-Status (Frontend-Polling) ────────────────────────────────────────
export async function getTaskStatus(taskId: string): Promise<{ state: string; resultUrls?: string[]; failMsg?: string }> {
  const res = await fetch(`${POLL_URL}?taskId=${taskId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Poll HTTP ${res.status}`);
  const json = await res.json();
  const data = json.data;
  let resultUrls: string[] | undefined;
  if (data.state === 'success' && data.resultJson) {
    const result = JSON.parse(data.resultJson);
    resultUrls = result.resultUrls;
  }
  return { state: data.state, resultUrls, failMsg: data.failMsg };
}

// ─── Bildgenerierung ─────────────────────────────────────────────────────────
// Model-Strings aus docs.kie.ai:
//   seedream/4.5-text-to-image  → Seedream 4.5 (empfohlen, nutzt aspect_ratio)
//   bytedance/seedream          → Seedream 3.0 (nutzt image_size)
//   ideogram/v3-text-to-image   → Ideogram V3
//   flux-2/pro-text-to-image    → Flux 2 Pro

export async function createImageTask(prompt: string, aspectRatio: string, model = 'seedream/4.5-text-to-image'): Promise<string> {
  if (model === 'bytedance/seedream') {
    // Seedream 3.0 nutzt image_size statt aspect_ratio
    const sizeMap: Record<string, string> = { '1:1':'square_hd','9:16':'portrait_16_9','16:9':'landscape_16_9','2:3':'portrait_4_3','4:5':'portrait_4_5' };
    return createTask(model, { prompt, image_size: sizeMap[aspectRatio] || 'square_hd', guidance_scale: 2.5 });
  }
  // Seedream 4.5+ nutzt aspect_ratio direkt
  return createTask(model, { prompt, aspect_ratio: aspectRatio, quality: 'basic' });
}

// ─── Video aus Bild ──────────────────────────────────────────────────────────
// Model: kling-2.6/image-to-video
// WICHTIG: image_urls ist ein Array, duration ist ein String ("5" oder "10")
export async function createImageToVideoTask(imageUrl: string, prompt: string, duration = 5, model = 'kling-2.6/image-to-video'): Promise<string> {
  return createTask(model, {
    prompt, image_urls: [imageUrl], sound: false, duration: String(duration),
  });
}

// ─── Text zu Video ────────────────────────────────────────────────────────────
// Model: kling-2.6/text-to-video
// sound: false ist PFLICHTFELD für kling-2.6/text-to-video!
export async function createTextToVideoTask(prompt: string, aspectRatio: string, duration = 5, model = 'kling-2.6/text-to-video'): Promise<string> {
  return createTask(model, { prompt, aspect_ratio: aspectRatio, duration: String(duration), sound: false });
}

// ─── Credits prüfen ──────────────────────────────────────────────────────────
export async function getCredits(): Promise<number> {
  const res = await fetch(`${KIE_BASE}/api/v1/chat/credit`, { headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` } });
  if (!res.ok) return -1;
  return (await res.json()).data as number;
}

// ─── File Upload ─────────────────────────────────────────────────────────────
export async function uploadFileBase64(base64: string, fileName: string): Promise<string> {
  const res = await fetch(`${KIE_UPLOAD_BASE}/upload/base64`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, fileName }),
  });
  if (!res.ok) throw new Error(`Upload HTTP ${res.status}`);
  return (await res.json()).data.fileUrl as string;
}

// ─── Veo 3 Video-Generierung ─────────────────────────────────────────────
// Eigener Endpoint: POST /api/v1/veo/generate
// Polling:          GET  /api/v1/veo/record-info?taskId=...
// Dauer ist fix ~8s pro Clip, nicht einstellbar

const VEO_GENERATE_URL = `${KIE_BASE}/api/v1/veo/generate`;
const VEO_POLL_URL = `${KIE_BASE}/api/v1/veo/record-info`;

export async function createVeoTask(
  prompt: string,
  opts: {
    model?: 'veo3' | 'veo3_fast' | 'veo3_lite';
    imageUrls?: string[];
    aspectRatio?: string;
  } = {}
): Promise<string> {
  const body: Record<string, unknown> = {
    prompt,
    model: opts.model || 'veo3_fast',
    aspect_ratio: opts.aspectRatio || '9:16',
    enableTranslation: true,
  };
  if (opts.imageUrls?.length) {
    body.imageUrls = opts.imageUrls;
  }

  for (let i = 0; i < 3; i++) {
    const res = await fetch(VEO_GENERATE_URL, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify(body),
    });
    if (res.status === 429) { await sleep(2000 * (i + 1)); continue; }
    if (!res.ok) { const t = await res.text(); throw new Error(`VEO HTTP ${res.status}: ${t}`); }
    const json = await res.json();
    if (!json.data?.taskId) throw new Error(`VEO error: ${JSON.stringify(json)}`);
    return json.data.taskId as string;
  }
  throw new Error('VEO rate limit: max retries exceeded');
}

export async function getVeoTaskStatus(taskId: string): Promise<{ state: string; resultUrls?: string[]; failMsg?: string }> {
  const res = await fetch(`${VEO_POLL_URL}?taskId=${taskId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`VEO Poll HTTP ${res.status}`);
  const json = await res.json();
  const data = json.data;
  // successFlag: 0=processing, 1=complete, 2=failed, 3=post-creation failure
  if (data.successFlag === 1) {
    // resultUrls koennen direkt in data oder unter data.response liegen
    const urls = data.response?.resultUrls || data.resultUrls || [data.videoUrl].filter(Boolean);
    console.log('[veo-poll] Success! URLs:', urls);
    return { state: 'success', resultUrls: urls };
  }
  if (data.successFlag === 2 || data.successFlag === 3) {
    return { state: 'fail', failMsg: data.failMsg || data.errorMessage || data.errorMsg || 'Veo generation failed' };
  }
  return { state: 'generating' };
}

// ─── Musik via Suno ───────────────────────────────────────────────────────────
export async function createMusicTask(description: string, duration = 30): Promise<string> {
  return createTask('suno/v4', { prompt: description, duration, make_instrumental: true });
}
