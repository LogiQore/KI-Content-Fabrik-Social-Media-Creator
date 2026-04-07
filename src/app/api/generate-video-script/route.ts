import { NextRequest, NextResponse } from 'next/server';
import { claudeChatJSON } from '@/lib/claude';

const MODEL_GUIDES: Record<string, string> = {
  'veo3_fast': `Veo 3 Fast (Google): Best for cinematic motion, smooth camera moves, realistic lighting.
- Strengths: Natural human movement, subtle expressions, cinematic quality
- Duration: Fixed 8s — plan ONE continuous take, no cuts
- Prompt style: Describe motion as a continuous film scene. Use cinematic language (dolly, tracking, rack focus).
- CRITICAL: Veo 3 interprets prompts very literally. Be specific about every movement.`,

  'veo3': `Veo 3 Quality (Google): Highest quality, same rules as Veo 3 Fast but with more detail.
- Duration: Fixed 8s — plan ONE continuous take, no cuts
- Prompt style: Very detailed cinematic descriptions, Veo 3 Quality can handle complex multi-element scenes.`,

  'veo3_lite': `Veo 3 Lite (Google): Budget version, simpler scenes work best.
- Duration: Fixed 8s — keep motion simple and clear
- Prompt style: Simple, clear descriptions. Avoid complex multi-character scenes.`,

  'kling-2.6/image-to-video': `Kling 2.6 Image-to-Video: Animates a still image with motion.
- Strengths: Good at subtle movements (hair blowing, eyes blinking, slight turns)
- Duration: 5s or 10s — describe continuous motion, no hard cuts
- Prompt style: Focus on WHAT MOVES and HOW. The base image provides the scene, you describe the animation.
- CRITICAL: Start from the image's current pose. Don't describe poses that contradict the still image.`,

  'kling-2.6/text-to-video': `Kling 2.6 Text-to-Video: Generates video purely from text.
- Duration: 5s or 10s — simple, focused scenes work best
- Prompt style: Full scene description needed (character, setting, action, lighting).`,

  'kling-3.0/image-to-video': `Kling 3.0 Image-to-Video: Latest Kling, better motion quality.
- Duration: 5s or 10s — same approach as Kling 2.6 but handles more complex motion
- Prompt style: Describe motion starting from the image's current state.`,

  'kling-3.0/text-to-video': `Kling 3.0 Text-to-Video: Latest Kling text-to-video.
- Duration: 5s or 10s — full scene description needed.`,
};

export async function POST(req: NextRequest) {
  const { title, description, caption, platform, theme, mode, model, duration, imagePrompt, avatarName } = await req.json();

  const modelGuide = MODEL_GUIDES[model] || MODEL_GUIDES['veo3_fast'];
  const isImageToVideo = mode === 'image-to-video';

  const sysMsg = `Du bist ein erfahrener Video-Director fuer Social-Media-Content und KI-Video-Prompt-Spezialist.

DEIN VIDEO-TOOL:
${modelGuide}

REGELN:
1. Das Script muss die KERNAUSSAGE des Beitrags visuell transportieren — nicht einfach "jemand sitzt am Tisch"
2. ${isImageToVideo ? 'Das Video wird aus dem Szenenbild animiert. Beschreibe Bewegungen die AUS DEM BILD heraus entstehen. Erfinde keine neue Szene!' : 'Das Video wird komplett aus Text generiert. Beschreibe die vollstaendige Szene.'}
3. Kein Text, keine Untertitel, keine Schrift, keine Sprechblasen im Video!
4. Die Handlung muss in ${duration}s erzaehlbar sein — keine ueberladenen Szenen
5. ${avatarName ? `Der Charakter "${avatarName}" muss der Hauptdarsteller sein.` : 'Der Hauptcharakter muss klar erkennbar und emotional ansprechend agieren.'}
6. Schreibe die Anweisungen auf DEUTSCH
7. Die Handlung soll Emotionen wecken und den Zuschauer in den ersten 2 Sekunden fesseln

Antworte NUR mit einem validen JSON-Objekt.`;

  const userMsg = `Erstelle ein professionelles ${duration}s Video-Script:

BEITRAG:
- Titel: ${title}
- Kernthema: ${theme}
- Plattform: ${platform}
${caption ? `- Caption (Kernaussage): ${caption.slice(0, 300)}` : ''}
${imagePrompt ? `- Szenenbild-Beschreibung: ${imagePrompt.slice(0, 400)}` : ''}

AUFGABE: Die Handlung muss die emotionale Kernaussage des Beitrags visuell verstaerken.
${isImageToVideo ? 'WICHTIG: Das Bild zeigt bereits die Szene. Beschreibe nur welche Bewegungen/Animationen darauf entstehen sollen.' : ''}

Gib exakt dieses JSON zurueck:
{
  "action": "Praezise Handlungs-/Bewegungsbeschreibung (DEUTSCH, 2-4 Saetze). Was tut der Charakter? Welche Gestik, Mimik, Koerperbewegung transportiert die Emotion? Auf die Kernaussage fokussiert.",
  "camera": "Professionelle Kamerafuehrung fuer ${model} (DEUTSCH, 1-3 Saetze). Perspektive, Bewegung, Fokus. Optimiert fuer ${duration}s Laufzeit."
}`;

  try {
    const script = await claudeChatJSON<{ action: string; camera: string }>(sysMsg, userMsg);
    return NextResponse.json({ script });
  } catch (e) {
    console.error('[generate-video-script]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
