import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { loadProject, getProjectAssetDir } from '@/lib/project';

export async function POST(req: NextRequest) {
  const { projectId } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'projectId fehlt' }, { status: 400 });

  const project = loadProject(projectId);
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 });

  const exportDir = getProjectAssetDir(projectId, 'export');
  const zipPath = path.join(exportDir, `${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_export.zip`);

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);

    const imgDir = getProjectAssetDir(projectId, 'images');
    const vidDir = getProjectAssetDir(projectId, 'videos');
    if (fs.existsSync(imgDir)) archive.directory(imgDir, 'images');
    if (fs.existsSync(vidDir)) archive.directory(vidDir, 'videos');

    // Captions als TXT
    const captions = project.contents
      .filter((c) => c.caption)
      .map((c) => `=== ${c.title} ===\n${c.caption}\n\n${(c.hashtags || []).join(' ')}\n`)
      .join('\n---\n\n');
    if (captions) archive.append(captions, { name: 'captions.txt' });

    archive.finalize();
  });

  const data = fs.readFileSync(zipPath);
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${path.basename(zipPath)}"`,
    },
  });
}
