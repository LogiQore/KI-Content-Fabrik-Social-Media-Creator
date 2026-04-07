import { NextRequest, NextResponse } from 'next/server';
import { claudeChatJSON } from '@/lib/claude';
import type { StrategyIdea, Platform } from '@/types';

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export async function POST(req: NextRequest) {
  const { projectName, platforms, audience, theme, userInstructions, count = 6, hook, mode = 'einzeln' } = await req.json();

  const hookHint = hook ? `\nDer virale Hook / Leitfaden für den Content ist: "${hook}"` : '';

  let systemPrompt: string;
  let userMsg: string;

  if (mode === 'story') {
    // ── Story-Modus: zusammenhängende Geschichte in X Teilen ──
    systemPrompt = `Du bist ein erfahrener Social-Media-Stratege und Storyteller für deutsche KMU und Personal Brands.
Erstelle eine zusammenhängende Story, aufgeteilt in genau ${count} Teile — jeder Teil ist ein eigener Social-Media-Beitrag.
Die Story muss einen roten Faden haben: Teil 1 beginnt, jeder Teil baut auf dem vorherigen auf, der letzte Teil schließt ab.
Antworte AUSSCHLIESSLICH mit validem JSON-Array. Keine Erklärungen, keine Markdown-Backticks.`;

    userMsg = `Erstelle eine zusammenhängende Story in ${count} Teilen für:
- Name: ${projectName}
- Thema/Kampagne: ${theme}
- Zielgruppe: ${audience}
- Plattformen: ${platforms.join(', ')}
${userInstructions ? `- Besondere Anweisungen: ${userInstructions}` : ''}${hookHint}

WICHTIG: Die ${count} Teile bilden EINE zusammenhängende Geschichte.
- Teil 1: Einstieg / Hook — fesselt sofort
- Teile 2 bis ${count - 1}: Entwicklung — baut Spannung auf, vertieft das Thema
- Teil ${count}: Auflösung / Call-to-Action

Jeder Teil ist ein eigenständiger Beitrag, aber die Story ergibt nur zusammen Sinn.
Nummeriere die Titel mit "Teil 1/X", "Teil 2/X" etc.

Gib ein JSON-Array zurück. Jedes Element hat genau diese Felder:
{
  "type": "image",
  "title": "Teil 1/${count}: Kurzer Titel",
  "description": "2-3 Sätze was in diesem Teil passiert/gezeigt wird",
  "platform": "${platforms[0]}",
  "aspectRatio": "9:16",
  "hashtagSuggestions": ["#tag1","#tag2","#tag3","#tag4","#tag5"]
}
Gib NUR das JSON-Array zurück, kein anderer Text.`;

  } else {
    // ── Einzeln-Modus: unabhängige Content-Ideen (bisheriges Verhalten) ──
    systemPrompt = `Du bist ein erfahrener Social-Media-Stratege für deutsche KMU und Personal Brands.
Erstelle präzise, umsetzbare Content-Ideen — immer auf Deutsch.
Antworte AUSSCHLIESSLICH mit validem JSON-Array. Keine Erklärungen, keine Markdown-Backticks.`;

    userMsg = `Erstelle ${count} konkrete Content-Ideen für folgendes Projekt:
- Name: ${projectName}
- Thema/Kampagne: ${theme}
- Zielgruppe: ${audience}
- Plattformen: ${platforms.join(', ')}
${userInstructions ? `- Besondere Anweisungen: ${userInstructions}` : ''}${hookHint}

Gib ein JSON-Array zurück. Jedes Element hat genau diese Felder:
{
  "type": "image",
  "title": "Kurzer Titel der Idee",
  "description": "2-3 Sätze Beschreibung",
  "platform": "${platforms[0]}",
  "aspectRatio": "1:1",
  "hashtagSuggestions": ["#tag1","#tag2","#tag3","#tag4","#tag5"]
}
Gib NUR das JSON-Array zurück, kein anderer Text.`;
  }

  try {
    const ideas = await claudeChatJSON<Omit<StrategyIdea, 'id' | 'active'>[]>(systemPrompt, userMsg);
    const result: StrategyIdea[] = ideas.map((idea) => ({
      ...idea,
      id: uid(),
      active: true,
      platform: (idea.platform || platforms[0]) as Platform,
    }));
    return NextResponse.json({ ideas: result });
  } catch (e) {
    console.error('[strategy] Fehler:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
