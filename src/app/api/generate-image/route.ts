import { NextRequest, NextResponse } from 'next/server';
import { claudeChat } from '@/lib/claude';
import { createTask } from '@/lib/kie-ai';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  const { contentTitle, contentDescription, platform, aspectRatio,
          brandStyle, userInstructions, bildstilPrompt, avatarPath, avatarName,
          avatarDescription, voiceOverMode, model } = await req.json();

  try {
    const isNanoBanana = model === 'nano-banana-2';
    const finalModel = model || 'nano-banana-2';

    // ── Avatar-Bild hochladen (komprimierte Version aus .cache) ──
    let avatarUrl: string | undefined;
    if (avatarPath && fs.existsSync(avatarPath)) {
      try {
        const { uploadFileBase64 } = await import('@/lib/kie-ai');
        const imgData = fs.readFileSync(avatarPath);
        const ext = path.extname(avatarPath).slice(1) || 'png';
        avatarUrl = await uploadFileBase64(
          `data:image/${ext};base64,${imgData.toString('base64')}`,
          path.basename(avatarPath)
        );
        console.log('[generate-image] Avatar hochgeladen:', avatarUrl, `(${(imgData.length / 1024).toFixed(0)} KB)`);
      } catch (e) {
        console.warn('[generate-image] Avatar-Upload fehlgeschlagen:', e);
      }
    }

    // ── Avatar-Hint fuer den Prompt aufbauen ──
    const styleHint  = bildstilPrompt ? `\nImage style: ${bildstilPrompt}` : '';

    const voiceOverHint = voiceOverMode
      ? '\nIMPORTANT: The character must be looking directly into the camera, engaging eye contact, as if speaking to the viewer. Close-up or medium shot, voice-over presentation style.'
      : '';

    let avatarHint = '';
    if (avatarName && avatarDescription) {
      // Beste Variante: Wir haben eine detaillierte Beschreibung vom Avatar
      avatarHint = `\n\nCRITICAL CHARACTER REQUIREMENTS:
The main character is "${avatarName}". You MUST include this EXACT character description in your prompt:
${avatarDescription}
${avatarUrl ? 'A reference image of this character is provided — match it EXACTLY.' : ''}
The character must be the focal point. Keep the character IDENTICAL across all images — same face, same proportions, same art style, same colors.
Do NOT change the character's appearance, age, skin tone, hair, or art style. Only change pose, expression, and scene.`;
    } else if (avatarName && avatarUrl) {
      // Fallback: Kein Description, aber Referenzbild vorhanden
      avatarHint = `\nIMPORTANT: The main character is "${avatarName}" — use the provided reference image to recreate this EXACT character with consistent appearance, face, colors and proportions. "${avatarName}" must be the focal point. Keep the character identical to the reference.`;
    } else if (avatarName) {
      avatarHint = `\nIMPORTANT: The main character is the avatar "${avatarName}". Show this character prominently.`;
    }

    const modelHint = isNanoBanana
      ? 'You are an expert at writing image prompts for Nano Banana 2 (Gemini 3.1 Flash Image).\nNano Banana 2 excels at character consistency when given detailed character descriptions and reference images.'
      : 'You are an expert at writing KI image generation prompts for Seedream and Flux models.';

    const promptSystemMsg = `${modelHint}
Create a detailed, vivid English prompt. Return ONLY the prompt, no explanations.
CRITICAL RULES:
- ONE single image only — NO split-screen, NO collage, NO multi-panel, NO grid, NO side-by-side.
- ABSOLUTELY NO TEXT in the image — no words, no letters, no titles, no captions, no speech bubbles, no signs with text, no watermarks, no typography, no quotes, no subtitles. The image must be purely visual with ZERO text elements.
- When a character description is provided, you MUST start the prompt with the full character description verbatim, then describe the scene around that character.
- NEVER simplify, shorten, or paraphrase the character description.${styleHint}${avatarHint}${voiceOverHint}`;

    const promptUserMsg = `Create an image prompt for: ${contentTitle}. ${contentDescription}. Platform: ${platform}. Aspect: ${aspectRatio}.${bildstilPrompt ? ` Style: ${bildstilPrompt}.` : ''}${userInstructions ? ` Extra: ${userInstructions}` : ''}`;

    const rawPrompt = await claudeChat(promptSystemMsg, promptUserMsg);
    const imagePrompt = rawPrompt.trim().slice(0, isNanoBanana ? 2000 : 600);

    // ── Input je nach Modell aufbauen ──
    let input: Record<string, unknown>;

    if (isNanoBanana) {
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
