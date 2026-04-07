import { NextRequest, NextResponse } from 'next/server';
import { claudeChatJSON } from '@/lib/claude';

export async function POST(req: NextRequest) {
  const { title, description, caption, platform, theme, mode } = await req.json();

  const sysMsg = `Du bist ein erfahrener Video-Director und KI-Video-Prompt-Experte.
Erstelle praezise Video-Regie-Anweisungen fuer KI-Video-Generierung (Veo 3, Kling).
Antworte NUR mit einem validen JSON-Objekt. Keine Erklaerungen, kein Markdown.
WICHTIG: Kein Text, keine Untertitel, keine Beschriftungen im Video!`;

  const userMsg = `Erstelle ein Video-Script fuer folgendes Social-Media-Video:
- Titel: ${title}
- Beschreibung: ${description}
- Plattform: ${platform}
- Thema: ${theme}
- Modus: ${mode === 'image-to-video' ? 'Bild wird animiert (Bewegungen auf ein Standbild)' : 'Komplettes Video aus Text generieren'}
${caption ? `- Caption: ${caption.slice(0, 200)}` : ''}

Gib exakt dieses JSON zurueck:
{
  "action": "Was passiert im Video? Welche Handlung, Bewegung, Gestik des Charakters? (2-3 Saetze, sehr konkret und visuell beschrieben)",
  "camera": "Kamera-Perspektive, Bewegung, Uebergaenge (z.B. Nahaufnahme Gesicht, langsamer Zoom-Out nach rechts, Schwenk zur Seite, weiche Ueberblendung)"
}`;

  try {
    const script = await claudeChatJSON<{ action: string; camera: string }>(sysMsg, userMsg);
    return NextResponse.json({ script });
  } catch (e) {
    console.error('[generate-video-script]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
