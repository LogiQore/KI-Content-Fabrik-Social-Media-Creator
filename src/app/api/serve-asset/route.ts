import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Statische Dateien aus dem tmp-Verzeichnis ausliefern
// Wird genutzt um lokal heruntergeladene kie.ai-Assets im Browser anzuzeigen
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'path Parameter fehlt' }, { status: 400 });
  }

  // Absoluten Pfad auflösen (relativ zum Projektverzeichnis)
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  // Sicherheitscheck: Datei muss im tmp-Verzeichnis liegen
  const tmpDir = path.join(process.cwd(), 'tmp');
  const normalizedPath = path.normalize(absolutePath);

  if (!normalizedPath.startsWith(path.normalize(tmpDir))) {
    return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
  }

  if (!fs.existsSync(normalizedPath)) {
    return NextResponse.json({ error: 'Datei nicht gefunden: ' + normalizedPath }, { status: 404 });
  }

  const data = fs.readFileSync(normalizedPath);
  const ext = path.extname(normalizedPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  };

  return new NextResponse(data, {
    headers: {
      'Content-Type': mimeMap[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
      'Content-Length': String(data.length),
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  });
}
