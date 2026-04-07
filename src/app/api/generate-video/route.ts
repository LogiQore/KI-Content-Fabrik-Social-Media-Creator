import { NextRequest, NextResponse } from 'next/server';
import { claudeChat } from '@/lib/claude';
import { createImageToVideoTask, createTextToVideoTask, createVeoTask } from '@/lib/kie-ai';

export async function POST(req: NextRequest) {
  const { mode, imageUrl, contentTitle, contentDescription, aspectRatio, duration, model } = await req.json();

  const isVeo = model?.startsWith('veo3');

  // Veo 3 unterstuetzt nur 16:9, 9:16 und Auto
  const veoRatioMap: Record<string, string> = {
    '9:16': '9:16', '16:9': '16:9',
    '1:1': '9:16', '4:5': '9:16', '2:3': '9:16',
  };
  const veoAspect = isVeo ? (veoRatioMap[aspectRatio] || '9:16') : aspectRatio;

  try {
    // imageUrl sollte jetzt eine Remote-URL (https://...) sein
    const resolvedImageUrl = (mode === 'image-to-video' && imageUrl?.startsWith('http')) ? imageUrl : undefined;
    if (mode === 'image-to-video' && !resolvedImageUrl) {
      console.warn('[generate-video] Keine gueltige Remote-URL fuer Bild:', imageUrl?.slice(0, 80));
    }

    // Script-Prompt ins Englische uebersetzen
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

    let taskId: string;

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
