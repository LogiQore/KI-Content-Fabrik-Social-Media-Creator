import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Liefert beliebige lokale Dateien aus (für Avatare etc.)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');
  if (!filePath) return NextResponse.json({ error: 'path fehlt' }, { status: 400 });

  const normalized = path.normalize(filePath);
  if (!fs.existsSync(normalized)) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });

  const data = fs.readFileSync(normalized);
  const ext = path.extname(normalized).toLowerCase();
  const mime: Record<string,string> = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.gif':'image/gif' };

  return new NextResponse(data, {
    headers: {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  });
}
