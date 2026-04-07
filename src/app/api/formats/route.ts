import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import type { SocialMediaFormat } from '@/types';

// Hardcoded Fallback — wird auch in social_media_formate.xlsx widergespiegelt
const DEFAULT_FORMATS: SocialMediaFormat[] = [
  { platform: 'instagram_beitrag',  label: 'Instagram Beitrag (Feed)',  width: 1080, height: 1080, aspectRatio: '1:1',  maxDurationSec: 60,    format: 'both',  maxFileSizeMB: 100, notes: 'Quadratisch; auch 4:5 möglich' },
  { platform: 'instagram_reels',    label: 'Instagram Reels',           width: 1080, height: 1920, aspectRatio: '9:16', maxDurationSec: 90,    format: 'video', maxFileSizeMB: 100, notes: 'Vertikal; max. 90 Sekunden' },
  { platform: 'tiktok',             label: 'TikTok',                    width: 1080, height: 1920, aspectRatio: '9:16', maxDurationSec: 600,   format: 'video', maxFileSizeMB: 287, notes: 'Vertikal; max. 10 Minuten' },
  { platform: 'youtube_shorts',     label: 'YouTube Shorts',            width: 1080, height: 1920, aspectRatio: '9:16', maxDurationSec: 60,    format: 'video', maxFileSizeMB: 256, notes: 'Vertikal; max. 60 Sekunden' },
  { platform: 'youtube_video',      label: 'YouTube Video',             width: 1920, height: 1080, aspectRatio: '16:9', maxDurationSec: 43200, format: 'video', maxFileSizeMB: 256, notes: 'Horizontal; kein Zeitlimit' },
  { platform: 'pinterest',          label: 'Pinterest Pin',             width: 1000, height: 1500, aspectRatio: '2:3',  maxDurationSec: 900,   format: 'both',  maxFileSizeMB: 20,  notes: 'Vertikal; Videos max. 15 Min' },
  { platform: 'linkedin_beitrag',   label: 'LinkedIn Beitrag',          width: 1200, height:  627, aspectRatio: '16:9', maxDurationSec: 600,   format: 'both',  maxFileSizeMB: 200, notes: 'Horizontal; Videos max. 10 Min' },
];

export async function GET() {
  try {
    const xlsxPath = path.join(process.cwd(), 'social_media_formate.xlsx');

    // Versuche xlsx zu lesen
    if (fs.existsSync(xlsxPath)) {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.readFile(xlsxPath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][];
        if (rows.length >= 2) {
          const headers = rows[0] as string[];
          const pIdx = headers.indexOf('platform');
          if (pIdx >= 0) {
            const formats: SocialMediaFormat[] = (rows.slice(1) as (string | number)[][]).map(r => ({
              platform: r[pIdx] as SocialMediaFormat['platform'],
              label: String(r[headers.indexOf('label')] ?? ''),
              width: Number(r[headers.indexOf('width')] ?? 1080),
              height: Number(r[headers.indexOf('height')] ?? 1080),
              aspectRatio: String(r[headers.indexOf('aspectRatio')] ?? '1:1'),
              maxDurationSec: Number(r[headers.indexOf('maxDurationSec')] ?? 60),
              format: (r[headers.indexOf('format')] ?? 'both') as SocialMediaFormat['format'],
              maxFileSizeMB: Number(r[headers.indexOf('maxFileSizeMB')] ?? 100),
              notes: String(r[headers.indexOf('notes')] ?? ''),
            }));
            if (formats.length > 0) return NextResponse.json({ formats, source: 'xlsx' });
          }
        }
      } catch (_) {
        // xlsx parse fehler → Fallback
      }
    }

    // Fallback: Hardcoded Defaults
    return NextResponse.json({ formats: DEFAULT_FORMATS, source: 'default' });
  } catch (e) {
    return NextResponse.json({ formats: DEFAULT_FORMATS, source: 'error', error: String(e) });
  }
}
