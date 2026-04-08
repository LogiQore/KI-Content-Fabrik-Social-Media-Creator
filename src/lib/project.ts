// lib/project.ts — Projekt-Datei-Operationen (Server-seitig)
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ContentItem } from '@/types';

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

// ─── Projekt-Explorer: Asset-Scanning & Phasen-Erkennung ────────────────────

export interface ProjectAssets {
  images: string[];
  audios: string[];
  videos: string[];
  reports: string[];
}

export interface PhaseStatus {
  completed: number[];
  nextPhase: number;
  status: Record<number, 'done' | 'partial' | 'missing'>;
}

function listFiles(dir: string, extensions?: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => {
    if (!extensions) return true;
    const ext = path.extname(f).toLowerCase();
    return extensions.includes(ext);
  });
}

export function scanProjectAssets(projectId: string): ProjectAssets {
  const base = path.join(getProjectsDir(), projectId);
  const images = listFiles(path.join(base, 'images'), ['.png', '.jpg', '.jpeg', '.webp']);
  const audios = listFiles(path.join(base, 'audio'), ['.mp3', '.wav', '.ogg']);
  const videos = listFiles(path.join(base, 'videos'), ['.mp4', '.webm']);
  const reports = fs.existsSync(base)
    ? fs.readdirSync(base).filter(f => f.endsWith('.md') && (f.includes('_beitrag_') || f.includes('_videoscript_')))
    : [];
  return { images, audios, videos, reports };
}

export function detectProjectPhase(project: Project, assets: ProjectAssets): PhaseStatus {
  const hasContents = project.contents && project.contents.length > 0;
  const hasCaptions = hasContents && project.contents.some(c => c.caption && c.caption.trim().length > 0);
  const hasImages = assets.images.length > 0;
  const hasAudios = assets.audios.length > 0;
  const hasVideos = assets.videos.length > 0;
  const hasReports = assets.reports.length > 0;

  const status: Record<number, 'done' | 'partial' | 'missing'> = {};
  const completed: number[] = [];

  // Phase 1: Projekt — immer done
  status[1] = 'done';
  completed.push(1);

  // Phase 2: Strategie — done wenn Contents oder Bilder vorhanden
  if (hasContents || hasImages) {
    status[2] = 'done';
    completed.push(2);
  } else {
    status[2] = 'missing';
  }

  // Phase 3: Bilder
  if (hasImages) {
    if (hasContents) {
      const itemsWithImages = project.contents.filter(c => c.imageLocalPath || c.imageUrl);
      status[3] = itemsWithImages.length >= project.contents.length ? 'done' : 'partial';
    } else {
      status[3] = 'done';
    }
    completed.push(3);
  } else {
    status[3] = status[2] === 'done' ? 'missing' : 'missing';
  }

  // Phase 4: Captions
  if (hasCaptions) {
    const allCaptions = project.contents.every(c => c.caption && c.caption.trim().length > 0);
    status[4] = allCaptions ? 'done' : 'partial';
    completed.push(4);
  } else {
    status[4] = 'missing';
  }

  // Phase 5: Voice
  if (hasAudios) {
    if (hasContents) {
      const itemsWithAudio = project.contents.filter(c => c.voiceLocalPath || c.voiceUrl);
      status[5] = itemsWithAudio.length >= project.contents.length ? 'done' : 'partial';
    } else {
      status[5] = 'done';
    }
    completed.push(5);
  } else {
    status[5] = 'missing';
  }

  // Phase 6: Videos
  if (hasVideos) {
    if (hasContents) {
      const itemsWithVideo = project.contents.filter(c => c.videoLocalPath || c.videoUrl);
      status[6] = itemsWithVideo.length >= project.contents.length ? 'done' : 'partial';
    } else {
      status[6] = 'done';
    }
    completed.push(6);
  } else {
    status[6] = 'missing';
  }

  // Phase 7: Editor — schwer zu erkennen, basierend auf Export-Dateien
  status[7] = 'missing';

  // Phase 8: Export
  if (hasReports) {
    status[8] = 'done';
    completed.push(8);
  } else {
    status[8] = 'missing';
  }

  // Nächste Phase: erste mit Status 'missing' nach letzter completed
  let nextPhase = 2;
  for (let i = 2; i <= 8; i++) {
    if (status[i] === 'missing') {
      nextPhase = i;
      break;
    }
    if (i === 8) nextPhase = 8;
  }

  return { completed, nextPhase, status };
}

// ─── Report-Parsing ─────────────────────────────────────────────────────────

export interface ReportSection {
  number: number;
  title: string;
  hasImage: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  hasCaption: boolean;
}

export interface ReportInfo {
  filename: string;
  type: 'beitrag' | 'videoscript';
  sections: ReportSection[];
  items: ContentItem[];
}

export function parseProjectReports(projectId: string): ReportInfo[] {
  const base = path.join(getProjectsDir(), projectId);
  if (!fs.existsSync(base)) return [];

  const mdFiles = fs.readdirSync(base).filter(f =>
    f.endsWith('.md') && (f.includes('_beitrag_') || f.includes('_videoscript_'))
  );

  const reports: ReportInfo[] = [];

  for (const filename of mdFiles) {
    const type: 'beitrag' | 'videoscript' = filename.includes('_beitrag_') ? 'beitrag' : 'videoscript';

    let content: string;
    try {
      content = fs.readFileSync(path.join(base, filename), 'utf-8');
    } catch {
      continue;
    }

    const sections: ReportSection[] = [];
    const sectionRegex = /## (\d+)\.\s+(.+)/g;
    const starts: { number: number; title: string; idx: number }[] = [];
    let m;
    while ((m = sectionRegex.exec(content)) !== null) {
      starts.push({ number: parseInt(m[1]), title: m[2].trim(), idx: m.index });
    }

    for (let i = 0; i < starts.length; i++) {
      const block = content.substring(starts[i].idx, i + 1 < starts.length ? starts[i + 1].idx : content.length);
      sections.push({
        number: starts[i].number,
        title: starts[i].title,
        hasImage: /\*\*Bild/.test(block) && /`[^`]+\.(png|jpg|jpeg|webp)`/.test(block),
        hasAudio: /\*\*(Voice-Over|Audio)/.test(block) && /`[^`]+\.(mp3|wav)`/.test(block),
        hasVideo: /\*\*Video/.test(block) && /`[^`]+\.(mp4|webm)`/.test(block),
        hasCaption: /\*\*Caption/.test(block) && block.split('**Caption')[1]?.trim().length > 10,
      });
    }

    const items = reconstructItemsFromReport(projectId, filename);
    reports.push({ filename, type, sections, items });
  }

  reports.sort((a, b) => a.filename.localeCompare(b.filename));
  return reports;
}

// ─── ContentItems aus Bericht-MD rekonstruieren ─────────────────────────────

export function reconstructItemsFromReport(projectId: string, filename: string): ContentItem[] {
  const filePath = path.join(getProjectsDir(), projectId, filename);
  if (!fs.existsSync(filePath)) return [];

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  // Header-Metadaten parsen
  const platformMatch = content.match(/\*\*Plattformen?:\*\*\s*(.+)/);
  const defaultPlatform = platformMatch ? platformMatch[1].trim().split(',')[0].trim() : 'tiktok';

  // Sektionen splitten
  const sectionRegex = /## (\d+)\.\s+(.+)/g;
  const starts: { number: number; title: string; idx: number }[] = [];
  let m;
  while ((m = sectionRegex.exec(content)) !== null) {
    starts.push({ number: parseInt(m[1]), title: m[2].trim(), idx: m.index });
  }

  const items: ContentItem[] = [];

  for (let i = 0; i < starts.length; i++) {
    const block = content.substring(starts[i].idx, i + 1 < starts.length ? starts[i + 1].idx : content.length);

    // Plattform + Format
    const secPlatformMatch = block.match(/\*\*Plattform:\*\*\s*(.+)/);
    const platform = secPlatformMatch ? secPlatformMatch[1].trim() : defaultPlatform;
    const formatMatch = block.match(/\*\*Format:\*\*\s*(.+)/);
    const formatParts = formatMatch ? formatMatch[1].trim().split('·').map(s => s.trim()) : [];
    const type = (formatParts[0] || 'image') as ContentItem['type'];
    const aspectRatio = formatParts[1] || '9:16';

    // Bild-Pfad
    const imageMatch = block.match(/\*\*Bild:\*\*\s*\n`([^`]+)`/);
    const imageLocalPath = imageMatch ? imageMatch[1].replace(/\\/g, '/') : undefined;

    // Video-Pfad
    const videoMatch = block.match(/\*\*Video:\*\*\s*\n`([^`]+)`/);
    const videoLocalPath = videoMatch ? videoMatch[1].replace(/\\/g, '/') : undefined;

    // Audio-Pfad
    const audioMatch = block.match(/\*\*Voice-Over \(Audio\):\*\*\s*\n`([^`]+)`/);
    const voiceLocalPath = audioMatch ? audioMatch[1].replace(/\\/g, '/') : undefined;

    // Sprechtext
    let sprechtext: string | undefined;
    const sprechtextMatch = block.match(/\*\*Sprechtext:\*\*\s*\n\n([\s\S]*?)(?=\n\n\*\*|---|\n##|$)/);
    if (sprechtextMatch) {
      sprechtext = sprechtextMatch[1].trim();
    }

    // Caption — alles zwischen **Caption:** und **Hashtags:** (oder ---)
    let caption: string | undefined;
    const captionMatch = block.match(/\*\*Caption:\*\*\s*\n\n([\s\S]*?)(?=\n\n\*\*Hashtags|\n---)/);
    if (captionMatch) {
      caption = captionMatch[1].trim();
    }

    // Hashtags
    let hashtags: string[] = [];
    const hashtagsMatch = block.match(/\*\*Hashtags:\*\*\s*\n(.+)/);
    if (hashtagsMatch) {
      hashtags = hashtagsMatch[1].trim().split(/\s+/).filter(h => h.startsWith('#'));
    }

    items.push({
      id: uuidv4(),
      type,
      title: starts[i].title,
      description: '',
      platform: platform as ContentItem['platform'],
      aspectRatio,
      active: true,
      imageLocalPath,
      imagePrompt: '',
      videoLocalPath,
      videoMode: videoLocalPath ? 'image-to-video' : 'none',
      voiceLocalPath,
      sprechtext,
      caption,
      hashtags,
      sceneNumber: starts[i].number,
    });
  }

  return items;
}
