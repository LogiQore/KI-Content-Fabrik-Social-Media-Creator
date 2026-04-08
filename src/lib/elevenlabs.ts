// lib/elevenlabs.ts — ElevenLabs TTS API
// Docs: https://elevenlabs.io/docs/api-reference

const BASE = 'https://api.elevenlabs.io';

function getKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY nicht gesetzt');
  return key;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  preview_url: string;
  labels?: Record<string, string>;
}

// ── Alle Stimmen abrufen ──
export async function getVoices(): Promise<ElevenLabsVoice[]> {
  const res = await fetch(`${BASE}/v1/voices`, {
    headers: { 'xi-api-key': getKey() },
  });
  if (!res.ok) throw new Error(`ElevenLabs voices HTTP ${res.status}`);
  const json = await res.json();
  return (json.voices || []) as ElevenLabsVoice[];
}

// ── Text-to-Speech (gibt Audio-Buffer zurueck) ──
export async function textToSpeech(
  voiceId: string,
  text: string,
  opts: { language?: string; stability?: number; similarityBoost?: number; style?: number; speed?: number } = {}
): Promise<Buffer> {
  const res = await fetch(`${BASE}/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': getKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      language_code: opts.language || 'de',
      voice_settings: {
        stability: opts.stability ?? 0.5,
        similarity_boost: opts.similarityBoost ?? 0.75,
        style: opts.style ?? 0,
        speed: opts.speed ?? 1.0,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs TTS HTTP ${res.status}: ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
