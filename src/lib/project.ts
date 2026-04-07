// lib/project.ts — Projekt-Datei-Operationen (Server-seitig)
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '@/types';

function getProjectsDir(): string {
  return process.env.PROJECTS_DIR || path.join(process.cwd(), 'tmp', 'projects');
}

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function saveProject(project: Project): void {
  const dir = path.join(getProjectsDir(), project.id);
  ensureDir(dir);
  ensureDir(path.join(dir, 'images'));
  ensureDir(path.join(dir, 'videos'));
  ensureDir(path.join(dir, 'audio'));
  ensureDir(path.join(dir, 'export'));
  const filePath = path.join(dir, 'project.json');
  fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8');
}

export function loadProject(projectId: string): Project | null {
  const filePath = path.join(getProjectsDir(), projectId, 'project.json');
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Project;
}

export function listProjects(): Project[] {
  const dir = getProjectsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((id) => loadProject(id))
    .filter(Boolean) as Project[];
}

export function deleteProject(projectId: string): void {
  const dir = path.join(getProjectsDir(), projectId);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

export function createNewProject(
  name: string,
  platforms: Project['platforms'],
  audience: string,
  theme: string,
  userInstructions: string,
  brandColors: string[],
  brandFont: string,
  toneOfVoice: string
): Project {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    name,
    platforms,
    audience,
    theme,
    userInstructions,
    brandColors,
    brandFont,
    toneOfVoice,
    createdAt: now,
    updatedAt: now,
    contents: [],
  };
}

export function getProjectAssetDir(projectId: string, type: 'images' | 'videos' | 'audio' | 'export') {
  const dir = path.join(getProjectsDir(), projectId, type);
  ensureDir(dir);
  return dir;
}
