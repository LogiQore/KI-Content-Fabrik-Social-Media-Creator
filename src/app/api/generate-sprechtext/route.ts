import { NextRequest, NextResponse } from 'next/server';
import { claudeChat } from '@/lib/claude';

export async function POST(req: NextRequest) {
  const { title, caption, description, platform, theme, sceneIndex, totalScenes, stimmung } = await req.json();

  const stimmungHint = stimmung
    ? `\nWICHTIG — STIMMUNG/EMOTION: "${stimmung}"
Schreibe den Text so, dass ElevenLabs diese Stimmung natuerlich interpretiert:
- Verwende passende Satzzeichen: "!" fuer Energie, "..." fuer Pausen/Spannung, "?" fuer Neugier
- Kurze abgehackte Saetze fuer Dramatik, fliessende Saetze fuer Waerme
- Wortwahl muss zur Stimmung passen (z.B. "fluesternd" → leise, intime Woerter)
- GROSSBUCHSTABEN sparsam fuer besondere Betonung einzelner Woerter`
    : '';

  const sysMsg = `Du bist ein erfahrener Social-Media-Texter und Voice-Over-Regisseur.
Erstelle einen gesprochenen Text (Voice-Over) fuer ein Social-Media-Video.
Der Text wird von einer KI-Stimme (ElevenLabs) vorgelesen — die Stimme interpretiert Emotion direkt aus dem Text!

REGELN:
1. Schreibe auf DEUTSCH in natuerlicher Sprechsprache — so wie ein Mensch spricht
2. Kurze, praegnante Saetze. Keine verschachtelten Nebensaetze.
3. Emotionale Ansprache: Du sprichst den Zuschauer direkt an ("du", "dich", "dir")
4. Der Text muss in ca. 6-8 Sekunden sprechbar sein (ca. 20-35 Woerter)
5. Nutze Satzzeichen bewusst fuer Emotion:
   - "..." fuer dramatische Pausen und Spannung
   - "!" fuer Energie und Ueberzeugung
   - "?" fuer rhetorische Fragen die zum Nachdenken anregen
   - Kurze Saetze. Punkt. Fuer. Wirkung.
6. Kein Hashtag, kein Emoji, keine Formatierung — nur reiner Sprechtext
7. ${sceneIndex === 0 ? 'ERSTER TEIL: Starte mit einem starken Hook der sofort fesselt!' : ''}
8. ${sceneIndex === totalScenes - 1 ? 'LETZTER TEIL: Ende mit einem klaren Call-to-Action!' : ''}${stimmungHint}

Antworte NUR mit dem Sprechtext, nichts anderes.`;

  const userMsg = `Erstelle einen Voice-Over Sprechtext fuer:
- Szene ${sceneIndex + 1} von ${totalScenes}
- Titel: ${title}
- Thema: ${theme}
- Plattform: ${platform}
${caption ? `- Caption (Kernaussage): ${caption.slice(0, 300)}` : ''}
${description ? `- Beschreibung: ${description.slice(0, 200)}` : ''}
${stimmung ? `- Gewuenschte Stimmung: ${stimmung}` : ''}`;

  try {
    const sprechtext = await claudeChat(sysMsg, userMsg);
    return NextResponse.json({ sprechtext: sprechtext.trim() });
  } catch (e) {
    console.error('[generate-sprechtext]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
