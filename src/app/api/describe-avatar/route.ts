import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const KIE_CLAUDE = 'https://api.kie.ai/claude/v1/messages';
const CACHE_DIR = path.join(process.cwd(), 'avatare', '.cache');

function getDescCachePath(avatarPath: string): string {
  const baseName = path.basename(avatarPath, path.extname(avatarPath));
  return path.join(CACHE_DIR, `${baseName}_desc.txt`);
}

export async function POST(req: NextRequest) {
  const { avatarPath, avatarName } = await req.json();

  if (!avatarPath || avatarPath === 'voice-over' || !fs.existsSync(avatarPath)) {
    return NextResponse.json({ description: '' });
  }

  // Check file cache (survives server restarts)
  const descFile = getDescCachePath(avatarPath);
  if (fs.existsSync(descFile)) {
    const cached = fs.readFileSync(descFile, 'utf-8').trim();
    if (cached) {
      console.log('[describe-avatar] Datei-Cache hit:', avatarName);
      return NextResponse.json({ description: cached });
    }
  }

  try {
    // Read avatar image and encode as base64
    const imgData = fs.readFileSync(avatarPath);
    const ext = path.extname(avatarPath).slice(1) || 'png';
    const mediaType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const base64 = imgData.toString('base64');

    // Ask Claude to describe the character
    const res = await fetch(KIE_CLAUDE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        stream: false,
        system: `You are a character description expert for AI image generation. Describe the character in the image in a concise, reusable way for consistent image generation across multiple scenes. Focus on PERMANENT visual traits only.

Output format (English, one paragraph, max 80 words):
- Art style (e.g. Pixar 3D, claymation, realistic, anime)
- Gender and approximate age
- Skin tone
- Hair: color, length, style
- Eye color and shape
- Face shape and distinctive features
- Body type
- Clothing style and colors (only if distinctive/iconic)

Do NOT describe pose, expression, background, or lighting. Only permanent character traits.`,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Describe this character named "${avatarName}" for consistent recreation in AI-generated images.`,
            },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Claude HTTP ${res.status}: ${text}`);
    }

    const json = await res.json();
    const description =
      json?.content?.[0]?.text ||
      json?.choices?.[0]?.message?.content ||
      '';

    if (description) {
      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(descFile, description, 'utf-8');
      console.log('[describe-avatar] Beschreibung gecacht:', descFile);
      console.log('[describe-avatar]', avatarName, '→', description.slice(0, 100));
    }

    return NextResponse.json({ description });
  } catch (e) {
    console.error('[describe-avatar] Fehler:', e);
    return NextResponse.json({ description: '', error: String(e) });
  }
}
