import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadProject } from '@/lib/project';

interface ScriptItem {
  title: string;
  platform: string;
  type: string;
  aspectRatio: string;
  caption?: string;
  imageLocalPath?: string;
  script: { action: string; camera: string };
  model: string;
  duration: number;
  videoLocalPath?: string;
}

export async function POST(req: NextRequest) {
  const { projectId, scripts } = await req.json() as { projectId: string; scripts: ScriptItem[] };
  if (!projectId) return NextResponse.json({ error: 'projectId fehlt' }, { status: 400 });

  const project = loadProject(projectId);
  if (!project) return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 });

  const now = new Date().toLocaleString('de-DE', { dateStyle: 'full', timeStyle: 'short' });

  let md = `# Video-Scripts: ${project.name}\n\n`;
  md += `**Erstellt:** ${now}  \n`;
  md += `**Thema:** ${project.theme}  \n`;
  md += `**Zielgruppe:** ${project.audience || '–'}  \n\n`;
  md += `---\n\n`;

  scripts.forEach((s, i) => {
    md += `## Teil ${i + 1}/${scripts.length}: ${s.title}\n\n`;
    md += `**Plattform:** ${s.platform} · ${s.type} · ${s.aspectRatio}  \n`;
    md += `**Modell:** ${s.model} · ${s.duration}s  \n\n`;

    if (s.imageLocalPath) {
      md += `**Bild:**  \n\`${s.imageLocalPath}\`\n\n`;
    }

    if (s.script.action) {
      md += `### 🎭 Handlung & Bewegung\n\n${s.script.action}\n\n`;
    }

    if (s.script.camera) {
      md += `### 🎥 Kamera & Perspektive\n\n${s.script.camera}\n\n`;
    }

    if (s.caption) {
      md += `### 📝 Caption\n\n${s.caption}\n\n`;
    }

    if (s.videoLocalPath) {
      md += `**Video:**  \n\`${s.videoLocalPath}\`\n\n`;
    }

    md += `---\n\n`;
  });

  // Fortlaufend nummeriert, nie ueberschreiben
  const projectDir = path.join(process.cwd(), 'tmp', 'projects', projectId);
  const safeTitle = project.name.replace(/[^a-zA-Z0-9_\-äöüÄÖÜ ]/g, '').trim().replace(/ /g, '_');

  let num = 1;
  let filePath = path.join(projectDir, `${String(num).padStart(2, '0')}_videoscript_${safeTitle}.md`);
  while (fs.existsSync(filePath)) {
    num++;
    filePath = path.join(projectDir, `${String(num).padStart(2, '0')}_videoscript_${safeTitle}.md`);
  }

  fs.writeFileSync(filePath, md, 'utf-8');

  return NextResponse.json({ filePath, ok: true });
}
