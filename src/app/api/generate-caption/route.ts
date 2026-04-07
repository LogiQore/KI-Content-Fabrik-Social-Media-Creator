import { NextRequest, NextResponse } from 'next/server';
import { claudeChatJSON } from '@/lib/claude';

export async function POST(req: NextRequest) {
  const { contentTitle, contentDescription, platform, audience, theme, toneOfVoice, userInstructions } = await req.json();

  const sysMsg = `Du bist ein Social-Media-Texter für deutsche Nutzer. Schreibe mitreißende Captions.
Antworte AUSSCHLIESSLICH mit validem JSON. Kein Text davor oder danach.
WICHTIG: Verwende in String-Werten KEINE doppelten Anführungszeichen. Nutze stattdessen einfache Anführungszeichen oder Gedankenstriche.`;

  const userMsg = `Schreibe eine Caption für:
- Titel: ${contentTitle}
- Beschreibung: ${contentDescription}
- Plattform: ${platform}
- Zielgruppe: ${audience}
- Kampagnen-Thema: ${theme}
- Tonalität: ${toneOfVoice || 'freundlich, motivierend, authentisch'}
${userInstructions ? `- Besondere Anweisungen: ${userInstructions}` : ''}

Gib exakt dieses JSON-Format zurück (Zeilenumbrüche als \\n):
{
  "caption": "Caption-Text hier, Zeilenumbrüche als \\n",
  "cta": "Kurzer Call-to-Action",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8"]
}`;

  try {
    const result = await claudeChatJSON<{ caption: string; cta: string; hashtags: string[] }>(sysMsg, userMsg);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[generate-caption] Fehler:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
