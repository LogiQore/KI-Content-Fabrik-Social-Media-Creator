import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech } from '@/lib/elevenlabs';
import { getProjectAssetDir } from '@/lib/project';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const { text, voiceId, projectId, provider, language, voiceSettings } = await req.json();

  if (!text || !voiceId || !projectId) {
    return NextResponse.json({ error: 'text, voiceId und projectId erforderlich' }, { status: 400 });
  }

  try {
    if (provider === 'did') {
      // D-ID Lipsync: spaetere Integration
      return NextResponse.json({ error: 'D-ID Lipsync ist noch nicht implementiert. Bitte ElevenLabs verwenden.' }, { status: 501 });
    }

    // ElevenLabs TTS
    const audioBuffer = await textToSpeech(voiceId, text, {
      language: language || 'de',
      stability: voiceSettings?.stability,
      similarityBoost: voiceSettings?.similarityBoost,
      style: voiceSettings?.style,
      speed: voiceSettings?.speed,
    });

    // Lokal speichern
    const dir = getProjectAssetDir(projectId, 'audio');
    const fileName = `voice_${uuidv4()}.mp3`;
    const localPath = path.join(dir, fileName);
    fs.writeFileSync(localPath, audioBuffer);

    // Dauer schaetzen (mp3: ~16kB/s bei 128kbps)
    const durationEstimate = Math.round((audioBuffer.length / 16000) * 10) / 10;

    const publicPath = `/api/serve-asset?path=${encodeURIComponent(localPath)}`;

    console.log(`[generate-voice] Audio gespeichert: ${localPath} (~${durationEstimate}s)`);

    return NextResponse.json({
      localPath,
      publicPath,
      duration: durationEstimate,
      ok: true,
    });
  } catch (e) {
    console.error('[generate-voice]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
