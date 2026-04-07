import { NextRequest, NextResponse } from 'next/server';
import { claudeChat } from '@/lib/claude';
import { createImageToVideoTask, createTextToVideoTask, createVeoTask } from '@/lib/kie-ai';

export async function POST(req: NextRequest) {
  const { mode, imageUrl, contentTitle, contentDescription, aspectRatio, duration, model } = await req.json();

  const isVeo = model?.startsWith('veo3');

  try {
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
      // ── Veo 3: eigener Endpoint ──
      const veoModel = model as 'veo3' | 'veo3_fast' | 'veo3_lite';
      const imageUrls = (mode === 'image-to-video' && imageUrl) ? [imageUrl] : undefined;
      taskId = await createVeoTask(finalPrompt, {
        model: veoModel,
        imageUrls,
        aspectRatio: aspectRatio || '9:16',
      });
    } else if (mode === 'image-to-video' && imageUrl) {
      // ── Kling: Bild-zu-Video ──
      taskId = await createImageToVideoTask(
        imageUrl, finalPrompt, duration || 5,
        model || 'kling-2.6/image-to-video'
      );
    } else {
      // ── Kling: Text-zu-Video ──
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
