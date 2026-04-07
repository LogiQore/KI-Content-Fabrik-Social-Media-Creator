import { NextRequest, NextResponse } from 'next/server';
import { claudeChat } from '@/lib/claude';
import { createTask } from '@/lib/kie-ai';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  const { contentTitle, contentDescription, platform, aspectRatio,
          brandStyle, userInstructions, bildstilPrompt, avatarPath, avatarName, model } = await req.json();

  try {
    const isNanoBanana = model === 'nano-banana-2';
    const finalModel = model || 'nano-banana-2';

    // ── Avatar-Bild hochladen (für alle Modelle die es unterstützen) ──
    let avatarUrl: string | undefined;
    if (avatarPath && avatarPath !== 'voice-over' && fs.existsSync(avatarPath)) {
      try {
        const { uploadFileBase64 } = await import('@/lib/kie-ai');
        const imgData = fs.readFileSync(avatarPath);
        const ext = path.extname(avatarPath).slice(1) || 'png';
        avatarUrl = await uploadFileBase64(
          `data:image/${ext};base64,${imgData.toString('base64')}`,
          path.basename(avatarPath)
        );
        console.log('[generate-image] Avatar hochgeladen:', avatarUrl);
      } catch (e) {
        console.warn('[generate-image] Avatar-Upload fehlgeschlagen:', e);
      }
    }

    // ── Prompt erstellen ──
    const styleHint  = bildstilPrompt ? `\nImage style: ${bildstilPrompt}` : '';
    const avatarHint = avatarPath === 'voice-over'
      ? '\nIMPORTANT: Show a person speaking directly into camera, voice-over style, close-up, engaging eye contact.'
      : (avatarName && avatarUrl && isNanoBanana)
      ? `\nIMPORTANT: The main character is "${avatarName}" — use the provided reference image to recreate this EXACT character with consistent appearance, face, colors and proportions. "${avatarName}" must be the focal point of the image. Keep the character identical to the reference.`
      : avatarName
      ? `\nIMPORTANT: The main character is the avatar "${avatarName}". Show this character prominently.`
      : '';

    const modelHint = isNanoBanana
      ? 'You are an expert at writing image prompts for Nano Banana 2 (Gemini 3.1 Flash Image).\nCreate a detailed, vivid English prompt with subject, setting, composition, lighting, and style.\nNano Banana 2 excels at character consistency, text rendering, and photorealistic outputs.'
      : 'You are an expert at writing KI image generation prompts for Seedream and Flux models.';

    const promptSystemMsg = `${modelHint}
Create a detailed, vivid English prompt. Return ONLY the prompt, no explanations.
CRITICAL RULES:
- ONE single image only — NO split-screen, NO collage, NO multi-panel, NO grid, NO side-by-side.
- ABSOLUTELY NO TEXT in the image — no words, no letters, no titles, no captions, no speech bubbles, no signs with text, no watermarks, no typography, no quotes, no subtitles. The image must be purely visual with ZERO text elements.${styleHint}${avatarHint}`;

    const promptUserMsg = `Create an image prompt for: ${contentTitle}. ${contentDescription}. Platform: ${platform}. Aspect: ${aspectRatio}.${bildstilPrompt ? ` Style: ${bildstilPrompt}.` : ''}${userInstructions ? ` Extra: ${userInstructions}` : ''}`;

    const rawPrompt = await claudeChat(promptSystemMsg, promptUserMsg);
    const imagePrompt = rawPrompt.trim().slice(0, isNanoBanana ? 2000 : 600);

    // ── Input je nach Modell aufbauen ──
    let input: Record<string, unknown>;

    if (isNanoBanana) {
      // Nano Banana 2: image_input Array für Referenzbilder, resolution statt quality
      input = {
        prompt: imagePrompt,
        aspect_ratio: aspectRatio,
        resolution: '1K',
        output_format: 'png',
      };
      if (avatarUrl) {
        input.image_input = [avatarUrl];
        console.log('[generate-image] Nano Banana 2: Avatar als image_input gesetzt');
      }
    } else {
      // Seedream / Flux / Ideogram: bisheriges Format
      input = {
        prompt: imagePrompt,
        aspect_ratio: aspectRatio,
        quality: 'basic',
      };
      if (avatarUrl) {
        input.reference_image_url = avatarUrl;
      }
    }

    const taskId = await createTask(finalModel, input);
    return NextResponse.json({ taskId, imagePrompt });

  } catch (e) {
    console.error('[generate-image]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
