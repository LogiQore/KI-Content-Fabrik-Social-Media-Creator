import { NextRequest, NextResponse } from 'next/server';
import { claudeChat } from '@/lib/claude';
import { createImageToVideoTask, createTextToVideoTask, createVeoTask } from '@/lib/kie-ai';
import { uploadImage as hedraUploadImage, uploadAudio as hedraUploadAudio, createGeneration as hedraCreateGeneration } from '@/lib/hedra';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const { mode, imageUrl, contentTitle, contentDescription, aspectRatio, duration, model,
          voiceLocalPath, imageLocalPath } = await req.json();

  const isVeo = model?.startsWith('veo3');
  const isHedra = model === 'hedra/lipsync';

  // Aspect-Ratio Mapping (Veo + Hedra: nur 9:16, 16:9, 1:1)
  const ratioMap: Record<string, string> = {
    '9:16': '9:16', '16:9': '16:9', '1:1': '1:1',
    '4:5': '9:16', '2:3': '9:16',
  };

  try {
    let taskId: string;

    if (isHedra) {
      // ── Hedra Lipsync: Bild + Audio → sprechendes Video ──
      // Lokale Dateien lesen und zu Hedra hochladen
      const imgPath = imageLocalPath;
      const audioPath = voiceLocalPath;

      if (!imgPath || !fs.existsSync(imgPath)) {
        throw new Error('Kein Bild vorhanden fuer Hedra Lipsync');
      }
      if (!audioPath || !fs.existsSync(audioPath)) {
        throw new Error('Kein Audio vorhanden fuer Hedra Lipsync. Bitte zuerst in Phase 5 (Voice) Audio generieren.');
      }

      console.log('[generate-video] Hedra: Lade Bild hoch...', imgPath);
      const imgBuffer = fs.readFileSync(imgPath);
      const imageAssetId = await hedraUploadImage(imgBuffer, path.basename(imgPath));

      console.log('[generate-video] Hedra: Lade Audio hoch...', audioPath);
      const audioBuffer = fs.readFileSync(audioPath);
      const audioAssetId = await hedraUploadAudio(audioBuffer, path.basename(audioPath));

      console.log('[generate-video] Hedra: Erstelle Lipsync-Video...');
      taskId = await hedraCreateGeneration({
        imageAssetId,
        audioAssetId,
        textPrompt: contentTitle,
        aspectRatio: ratioMap[aspectRatio] || '9:16',
      });

      return NextResponse.json({ taskId, isHedra: true });
    }

    // ── Veo / Kling: Prompt-basierte Videogenerierung ──
    const resolvedImageUrl = (mode === 'image-to-video' && imageUrl?.startsWith('http')) ? imageUrl : undefined;
    if (mode === 'image-to-video' && !resolvedImageUrl) {
      console.warn('[generate-video] Keine gueltige Remote-URL fuer Bild:', imageUrl?.slice(0, 80));
    }

    const maxChars = isVeo ? 900 : 300;
    const sysMsg = `You are an expert at writing KI video generation prompts.
Translate and enhance the following German video script into a concise, vivid English prompt.
Return ONLY the prompt text, nothing else. Max ${maxChars} characters.
CRITICAL: NO text, no captions, no subtitles, no watermarks, no written words in the video.`;

    const userMsg = `Title: ${contentTitle}
Script: ${contentDescription}
Mode: ${mode === 'image-to-video' ? 'animate a still image' : 'generate video from text'}
Aspect ratio: ${aspectRatio || '9:16'}`;

    const videoPrompt = await claudeChat(sysMsg, userMsg);
    const finalPrompt = videoPrompt.trim().slice(0, maxChars);

    const veoAspect = isVeo ? (ratioMap[aspectRatio] || '9:16') : aspectRatio;

    if (isVeo) {
      const veoModel = model as 'veo3' | 'veo3_fast' | 'veo3_lite';
      const imageUrls = resolvedImageUrl ? [resolvedImageUrl] : undefined;
      taskId = await createVeoTask(finalPrompt, {
        model: veoModel,
        imageUrls,
        aspectRatio: veoAspect,
      });
    } else if (mode === 'image-to-video' && resolvedImageUrl) {
      taskId = await createImageToVideoTask(
        resolvedImageUrl, finalPrompt, duration || 5,
        model || 'kling-2.6/image-to-video'
      );
    } else {
      taskId = await createTextToVideoTask(
        finalPrompt, aspectRatio || '9:16', duration || 5,
        model || 'kling-2.6/text-to-video'
      );
    }

    return NextResponse.json({ taskId, videoPrompt: finalPrompt, isVeo });
  } catch (e) {
    console.error('[generate-video]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
