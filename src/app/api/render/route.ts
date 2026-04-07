import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getProjectAssetDir } from '@/lib/project';

export async function POST(req: NextRequest) {
  const { editorProject, projectId } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'projectId fehlt' }, { status: 400 });

  try {
    // Vereinfachtes Render: Erstes Media-Clip als Output zurückgeben
    const mediaTrack = editorProject?.tracks?.find((t: { type: string }) => t.type === 'media');
    const firstClip = mediaTrack?.clips?.[0];

    if (firstClip?.url) {
      const exportDir = getProjectAssetDir(projectId, 'export');
      const outputPath = path.join(exportDir, `render_${Date.now()}.mp4`);
      // In einer vollständigen Implementierung: ffmpeg-Render-Pipeline hier
      // Für jetzt: URL zurückgeben damit Frontend es direkt anzeigen kann
      return NextResponse.json({
        outputPath: firstClip.url,
        message: 'Direkter Asset-Export (ffmpeg-Render in Entwicklung)',
      });
    }

    return NextResponse.json({ error: 'Keine Media-Clips in der Timeline' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
