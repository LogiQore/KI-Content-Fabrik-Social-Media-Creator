import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const AVATAR_DIR = path.join(process.cwd(), 'avatare');
const IMG_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

export async function GET() {
  try {
    if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
    const files = fs.readdirSync(AVATAR_DIR)
      .filter(f => IMG_EXT.includes(path.extname(f).toLowerCase()))
      .map(f => ({
        name: path.basename(f, path.extname(f)),
        fileName: f,
        path: path.join(AVATAR_DIR, f),
        publicUrl: `/api/serve-file?path=${encodeURIComponent(path.join(AVATAR_DIR, f))}`,
      }));
    return NextResponse.json({ avatare: files });
  } catch (e) {
    return NextResponse.json({ avatare: [], error: String(e) });
  }
}
