import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { getProjectAssetDir } from '@/lib/project';

// Asset-URL von kie.ai auf lokalen Server herunterladen
export async function POST(req: NextRequest) {
  const { url, projectId, type = 'images', fileName } = await req.json();
  if (!url || !projectId) return NextResponse.json({ error: 'url und projectId erforderlich' }, { status: 400 });

  try {
    const dir = getProjectAssetDir(projectId, type as 'images' | 'videos' | 'audio' | 'export');
    const ext = url.split('.').pop()?.split('?')[0] || (type === 'videos' ? 'mp4' : 'jpg');
    const localName = fileName || `${uuidv4()}.${ext}`;
    const localPath = path.join(dir, localName);

    await downloadFile(url, localPath);
    const publicPath = `/api/serve-asset?path=${encodeURIComponent(localPath)}`;
    return NextResponse.json({ localPath, publicPath });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        downloadFile(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}
