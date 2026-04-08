import { NextResponse } from 'next/server';
import { listProjects, scanProjectAssets, detectProjectPhase, parseProjectReports } from '@/lib/project';
import type { ProjectExplorerData } from '@/types';

export async function GET() {
  try {
    const projects = listProjects();

    const data: ProjectExplorerData[] = projects.map(project => {
      const assets = scanProjectAssets(project.id);
      const phase = detectProjectPhase(project, assets);
      const reportDetails = parseProjectReports(project.id);

      return {
        project,
        assets,
        counts: {
          images: assets.images.length,
          audios: assets.audios.length,
          videos: assets.videos.length,
          reports: assets.reports.length,
        },
        phase,
        reportDetails,
      };
    });

    // Sortierung: neueste zuerst
    data.sort((a, b) => new Date(b.project.updatedAt).getTime() - new Date(a.project.updatedAt).getTime());

    return NextResponse.json({ data });
  } catch (err) {
    console.error('project-explorer error:', err);
    return NextResponse.json({ error: 'Fehler beim Laden der Projekte' }, { status: 500 });
  }
}
