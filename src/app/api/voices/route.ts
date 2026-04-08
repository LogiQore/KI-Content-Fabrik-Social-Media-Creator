import { NextResponse } from 'next/server';
import { getVoices } from '@/lib/elevenlabs';
import { getVoiceClones } from '@/lib/did';
import type { VoiceOption } from '@/types';

export async function GET() {
  const voices: VoiceOption[] = [];

  // ElevenLabs Stimmen
  try {
    const elVoices = await getVoices();
    for (const v of elVoices) {
      voices.push({
        id: v.voice_id,
        name: v.name,
        provider: 'elevenlabs',
        previewUrl: v.preview_url,
        category: v.category || 'premade',
        language: v.labels?.language || 'multi',
      });
    }
    console.log(`[voices] ${elVoices.length} ElevenLabs Stimmen geladen`);
  } catch (e) {
    console.warn('[voices] ElevenLabs Fehler:', e);
  }

  // D-ID Voice Clones (eigene Stimme)
  try {
    const didClones = await getVoiceClones();
    for (const v of didClones) {
      voices.push({
        id: v.id,
        name: `🎤 ${v.name} (D-ID Klon)`,
        provider: 'did',
        language: v.language,
        category: 'cloned',
      });
    }
    if (didClones.length > 0) {
      console.log(`[voices] ${didClones.length} D-ID Voice Clones geladen`);
    }
  } catch (e) {
    console.warn('[voices] D-ID Fehler:', e);
  }

  return NextResponse.json({ voices });
}
