// lib/did.ts — D-ID API (Lipsync-Videos + Voice Clones)
// Docs: https://docs.d-id.com
// Vorbereitet fuer spaetere Lipsync-Integration

const BASE = 'https://api.d-id.com';

function getKey(): string {
  const key = process.env.DID_API_KEY;
  if (!key) throw new Error('DID_API_KEY nicht gesetzt');
  return key;
}

export interface DidVoiceClone {
  id: string;
  name: string;
  language: string;
}

// ── Eigene geklonte Stimmen abrufen ──
export async function getVoiceClones(): Promise<DidVoiceClone[]> {
  try {
    const res = await fetch(`${BASE}/tts/voices`, {
      headers: {
        'Authorization': `Basic ${getKey()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      console.warn(`[did] Voice clones HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    return (json.voices || []).map((v: Record<string, string>) => ({
      id: v.id || v.voiceId,
      name: v.name || 'Meine Stimme',
      language: v.language || 'de',
    }));
  } catch (e) {
    console.warn('[did] Voice clones Fehler:', e);
    return [];
  }
}

// ── Presenter/Avatare abrufen (fuer Lipsync) ──
export async function getPresenters(): Promise<{ id: string; name: string; previewUrl?: string }[]> {
  try {
    const res = await fetch(`${BASE}/clips/presenters?limit=50`, {
      headers: {
        'Authorization': `Basic ${getKey()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.presenters || []).map((p: Record<string, string>) => ({
      id: p.presenter_id,
      name: p.name,
      previewUrl: p.talking_preview_url || p.thumbnail_url,
    }));
  } catch {
    return [];
  }
}
