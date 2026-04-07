// lib/claude.ts — Claude via kie.ai
// Endpoint: https://api.kie.ai/claude/v1/messages (Anthropic-Format)

const KIE_CLAUDE = 'https://api.kie.ai/claude/v1/messages';

export async function claudeChat(
  systemPrompt: string,
  userMessage: string,
  model = 'claude-sonnet-4-6'
): Promise<string> {
  const res = await fetch(KIE_CLAUDE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: false,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();
  const text =
    json?.content?.[0]?.text ||
    json?.choices?.[0]?.message?.content ||
    json?.text;

  if (!text) throw new Error(`Unbekanntes Response-Format: ${JSON.stringify(json).slice(0, 200)}`);
  return text as string;
}

// Wandelt beliebige Claude-Ausgabe in valides JSON um
function extractAndFixJSON(raw: string): string {
  // 1. Markdown-Fences entfernen
  let s = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();

  // 2. Vorangestelltes "json" Wort entfernen (z.B. "json\n{...}")
  s = s.replace(/^json\s*/i, '').trim();

  // 3. Nur den JSON-Block extrahieren (erstes { } oder [ ])
  const match = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) s = match[1];

  // 4. Single-Quotes bei Property-Namen durch Double-Quotes ersetzen
  //    z.B. {'caption': 'text'} → {"caption": "text"}
  //    Nur äußere Property-Names, nicht innerhalb von Strings
  s = s.replace(/'([^']+)'(\s*:)/g, '"$1"$2');

  // 5. Single-Quoted String-Werte → Double-Quoted
  //    Nur wenn sie nach : stehen (einfache Heuristik)
  s = s.replace(/:\s*'([^']*)'/g, ': "$1"');

  return s;
}

export async function claudeChatJSON<T>(
  systemPrompt: string,
  userMessage: string,
  model = 'claude-sonnet-4-6'
): Promise<T> {
  const raw = await claudeChat(
    systemPrompt +
      '\n\nAntworte NUR mit einem einzigen validen JSON-Objekt. ' +
      'Keine Erklärungen, kein Markdown, keine Backticks. ' +
      'Alle Property-Namen und String-Werte in doppelten Anführungszeichen. ' +
      'Keine doppelten Anführungszeichen INNERHALB von String-Werten.',
    userMessage,
    model
  );

  console.log('[claudeChatJSON] RAW (erste 300):', raw.slice(0, 300));

  // Versuch 1: direkt parsen
  try { return JSON.parse(raw) as T; } catch (_) {}

  // Versuch 2: bereinigen und parsen
  const cleaned = extractAndFixJSON(raw);
  console.log('[claudeChatJSON] CLEANED (erste 300):', cleaned.slice(0, 300));

  try { return JSON.parse(cleaned) as T; } catch (_) {}

  // Versuch 3: Kontrollzeichen raus und nochmal
  const sanitized = cleaned.replace(/[\x00-\x1F\x7F]/g, (c) =>
    c === '\n' ? '\\n' : c === '\t' ? '\\t' : c === '\r' ? '\\r' : ''
  );
  try { return JSON.parse(sanitized) as T; } catch (_) {}

  throw new Error(`JSON Parse fehlgeschlagen. Raw: ${raw.slice(0, 400)}`);
}
