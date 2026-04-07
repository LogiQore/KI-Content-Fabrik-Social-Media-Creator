import { NextRequest, NextResponse } from 'next/server';
import { claudeChatJSON } from '@/lib/claude';

export async function POST(req: NextRequest) {
  const { projectName, theme, audience, platforms } = await req.json();

  const systemPrompt = `Du bist ein Top-Experte für virale Social-Media-Hooks auf Deutsch.
Ein Hook ist der allererste Satz / die erste Zeile eines Beitrags, die sofort Aufmerksamkeit erzeugt und zum Weiterlesen/Weiterschauen zwingt.
Antworte AUSSCHLIESSLICH mit einem JSON-Array aus genau 5 Strings. Keine Erklärungen, keine Markdown-Backticks.`;

  const userMsg = `Erstelle 5 verschiedene virale Hook-Vorschläge für folgendes Projekt:
- Projektname: ${projectName}
- Thema: ${theme}
- Zielgruppe: ${audience}
- Plattformen: ${(platforms || []).join(', ')}

Regeln für gute Hooks:
- Provokant, überraschend oder emotional
- Kurz und knackig (max. 10-15 Wörter)
- Erzeugt Neugier oder einen "Das muss ich wissen"-Effekt
- Verschiedene Hook-Typen mischen: Frage-Hook, Schock-Hook, Zahlen-Hook, Storytelling-Hook, Kontrovers-Hook

Gib NUR ein JSON-Array mit 5 Strings zurück, z.B.:
["Hook 1", "Hook 2", "Hook 3", "Hook 4", "Hook 5"]`;

  try {
    const hooks = await claudeChatJSON<string[]>(systemPrompt, userMsg);
    return NextResponse.json({ hooks });
  } catch (e) {
    console.error('[generate-hooks]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
