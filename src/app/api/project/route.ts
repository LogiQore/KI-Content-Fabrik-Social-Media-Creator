import { NextRequest, NextResponse } from 'next/server';
import { saveProject, loadProject, listProjects, deleteProject, createNewProject } from '@/lib/project';
import type { Project } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (id) {
    const project = loadProject(id);
    if (!project) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    return NextResponse.json({ project });
  }
  return NextResponse.json({ projects: listProjects() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === 'create') {
    const project = createNewProject(
      body.name, body.platforms, body.audience,
      body.theme, body.userInstructions,
      body.brandColors || [], body.brandFont || '', body.toneOfVoice || ''
    );
    saveProject(project);
    return NextResponse.json({ project });
  }

  if (action === 'update') {
    const existing = loadProject(body.project.id);
    if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    const updated: Project = { ...existing, ...body.project, updatedAt: new Date().toISOString() };
    saveProject(updated);
    return NextResponse.json({ project: updated });
  }

  if (action === 'delete') {
    deleteProject(body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 });
}
