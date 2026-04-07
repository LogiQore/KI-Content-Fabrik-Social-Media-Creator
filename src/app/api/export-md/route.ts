import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadProject } from '@/lib/project';
import type { ContentItem } from '@/types';

export async function POST(req: NextRequest) {
  const { projectId, items } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'projectId fehlt' }, { status: 400 });

  const project = loadProject(projectId);
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 });

  const now = new Date().toLocaleString('de-DE', { dateStyle: 'full', timeStyle: 'short' });

  // Markdown aufbauen
  let md = `# ${project.name}\n\n`;
  md += `**Erstellt:** ${now}  \n`;
  md += `**Thema:** ${project.theme}  \n`;
  md += `**Zielgruppe:** ${project.audience || '–'}  \n`;
  md += `**Plattformen:** ${project.platforms.join(', ')}  \n\n`;
  md += `---\n\n`;

  const contentItems: ContentItem[] = items || project.contents || [];

  contentItems.forEach((item: ContentItem, i: number) => {
    md += `## ${i + 1}. ${item.title}\n\n`;
    md += `**Plattform:** ${item.platform}  \n`;
    md += `**Format:** ${item.type} · ${item.aspectRatio}  \n\n`;

    if (item.imageLocalPath) {
      md += `**Bild:**  \n\`${item.imageLocalPath}\`\n\n`;
    }
    if (item.videoLocalPath) {
      md += `**Video:**  \n\`${item.videoLocalPath}\`\n\n`;
    }

    if (item.caption) {
      md += `**Caption:**\n\n${item.caption}\n\n`;
    }

    if (item.hashtags && item.hashtags.length > 0) {
      md += `**Hashtags:**  \n${item.hashtags.join(' ')}\n\n`;
    }

    md += `---\n\n`;
  });

  // Datei im Projektverzeichnis speichern (fortlaufend nummeriert, nie ueberschreiben)
  const projectDir = path.join(process.cwd(), 'tmp', 'projects', projectId);
  const safeTitle = project.name.replace(/[^a-zA-Z0-9_\-äöüÄÖÜ ]/g, '').trim().replace(/ /g, '_');

  let num = 1;
  let filePath = path.join(projectDir, `${String(num).padStart(2, '0')}_beitrag_${safeTitle}.md`);
  while (fs.existsSync(filePath)) {
    num++;
    filePath = path.join(projectDir, `${String(num).padStart(2, '0')}_beitrag_${safeTitle}.md`);
  }

  fs.writeFileSync(filePath, md, 'utf-8');

  return NextResponse.json({ filePath, ok: true });
}
