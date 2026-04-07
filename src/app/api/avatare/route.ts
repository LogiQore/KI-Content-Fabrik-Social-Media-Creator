import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const AVATAR_DIR = path.join(process.cwd(), 'avatare');
const CACHE_DIR = path.join(AVATAR_DIR, '.cache');
const IMG_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const MAX_REF_SIZE = 1024; // px

async function getOrCreateRef(originalPath: string, fileName: string): Promise<string> {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

  const baseName = path.basename(fileName, path.extname(fileName));
  const refPath = path.join(CACHE_DIR, `${baseName}_ref.png`);

  if (fs.existsSync(refPath)) return refPath;

  try {
    await sharp(originalPath)
      .resize(MAX_REF_SIZE, MAX_REF_SIZE, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 85, compressionLevel: 8 })
      .toFile(refPath);
    const stats = fs.statSync(refPath);
    console.log(`[avatare] Komprimiert: ${fileName} → ${(stats.size / 1024).toFixed(0)} KB`);
  } catch (e) {
    console.warn(`[avatare] Komprimierung fehlgeschlagen fuer ${fileName}:`, e);
    return originalPath;
  }

  return refPath;
}

export async function GET() {
  try {
    if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
    const files = fs.readdirSync(AVATAR_DIR)
      .filter(f => IMG_EXT.includes(path.extname(f).toLowerCase()));

    const avatare = await Promise.all(files.map(async f => {
      const originalPath = path.join(AVATAR_DIR, f);
      const refPath = await getOrCreateRef(originalPath, f);
      return {
        name: path.basename(f, path.extname(f)),
        fileName: f,
        path: refPath,
        originalPath,
        publicUrl: `/api/serve-file?path=${encodeURIComponent(originalPath)}`,
      };
    }));

    return NextResponse.json({ avatare });
  } catch (e) {
    return NextResponse.json({ avatare: [], error: String(e) });
  }
}
