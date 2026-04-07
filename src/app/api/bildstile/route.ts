import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

interface Bildstil {
  id: string; label: string; englisch_prompt: string; beschreibung: string; kategorie: string;
}

const DEFAULT_STILE: Bildstil[] = [
  { id: 'fotorealistisch', label: 'Fotorealistisch', englisch_prompt: 'photorealistic, ultra-detailed, shot on Canon EOS R5, 8K', beschreibung: 'Sieht aus wie ein echtes Foto', kategorie: 'Realismus' },
  { id: 'cinematic', label: 'Cinematic / Filmstil', englisch_prompt: 'cinematic photography, dramatic lighting, bokeh, movie still', beschreibung: 'Hollywood-Ästhetik mit Tiefenschärfe', kategorie: 'Realismus' },
  { id: 'semi_realistisch', label: 'Semi-Realistisch', englisch_prompt: 'semi-realistic digital art, detailed illustration, concept art', beschreibung: 'Zwischen Foto und Illustration', kategorie: 'Realismus' },
  { id: 'pixar', label: 'Pixar 3D Stil', englisch_prompt: 'Pixar animation style, 3D render, colorful, warm lighting, Disney Pixar movie', beschreibung: 'Freundliche 3D-Figuren wie Toy Story', kategorie: '3D & Animation' },
  { id: 'studio_ghibli', label: 'Studio Ghibli', englisch_prompt: 'Studio Ghibli anime style, soft watercolor tones, Miyazaki inspired', beschreibung: 'Japanische Anime-Ästhetik, traumhaft', kategorie: 'Anime & Manga' },
  { id: 'anime', label: 'Anime Stil', englisch_prompt: 'anime art style, clean lines, vivid colors, cel shading', beschreibung: 'Klassischer Anime-Look', kategorie: 'Anime & Manga' },
  { id: 'comic_american', label: 'American Comic', englisch_prompt: 'American comic book style, bold outlines, halftone dots', beschreibung: 'Marvel/DC-Ästhetik', kategorie: 'Illustration' },
  { id: 'flat_design', label: 'Flat Design', englisch_prompt: 'flat design illustration, minimal shadows, geometric shapes, clean vectors', beschreibung: 'Modern und minimalistisch', kategorie: 'Illustration' },
  { id: 'aquarell', label: 'Aquarell', englisch_prompt: 'watercolor painting, soft edges, paper texture, flowing colors', beschreibung: 'Handgemalte Aquarelloptik', kategorie: 'Malerisch' },
  { id: 'digital_art', label: 'Digitale Illustration', englisch_prompt: 'digital painting, concept art, detailed illustration, ArtStation style', beschreibung: 'Professionelle digitale Kunst', kategorie: 'Malerisch' },
  { id: 'sketch', label: 'Bleistiftskizze', englisch_prompt: 'pencil sketch, hand-drawn, rough lines, sketchbook style', beschreibung: 'Authentische Bleistiftzeichnung', kategorie: 'Malerisch' },
  { id: 'vintage', label: 'Vintage / Retro', englisch_prompt: 'vintage illustration, retro style, aged paper, old poster design, 1950s', beschreibung: 'Nostalgischer Retro-Look', kategorie: 'Spezial' },
  { id: 'cyberpunk', label: 'Cyberpunk', englisch_prompt: 'cyberpunk art, neon lights, dark city, futuristic, blade runner aesthetic', beschreibung: 'Dystopische Neon-Zukunft', kategorie: 'Spezial' },
  { id: 'minimalistisch', label: 'Minimalistisch', englisch_prompt: 'minimalist design, simple composition, negative space, clean aesthetic', beschreibung: 'Weniger ist mehr', kategorie: 'Spezial' },
  { id: 'pixel_art', label: 'Pixel Art', englisch_prompt: 'pixel art, 8-bit style, retro game graphics, limited color palette', beschreibung: '8-Bit/16-Bit Videospiel-Ästhetik', kategorie: 'Digital' },
  { id: 'pop_art', label: 'Pop Art', englisch_prompt: 'pop art style, Andy Warhol inspired, bold colors, halftone pattern', beschreibung: 'Knallbunt wie Andy Warhol', kategorie: 'Spezial' },
  { id: 'sticker', label: 'Sticker Stil', englisch_prompt: 'sticker art style, white outline, cute characters, bold colors, glossy finish', beschreibung: 'Knuffige Sticker-Optik', kategorie: 'Illustration' },
  { id: 'claymation', label: 'Claymation / Knetoptik', englisch_prompt: 'claymation style, clay texture, stop motion look, soft modeling clay', beschreibung: 'Weiche Knetfigur-Optik', kategorie: '3D & Animation' },
  { id: 'dark_fantasy', label: 'Dark Fantasy', englisch_prompt: 'dark fantasy illustration, dramatic, gothic, detailed, epic scene', beschreibung: 'Düstere Fantasy-Ästhetik', kategorie: 'Spezial' },
  { id: 'concept_art', label: 'Concept Art (SciFi)', englisch_prompt: 'sci-fi concept art, futuristic design, technical illustration', beschreibung: 'Technisches Zukunfts-Design', kategorie: 'Spezial' },
];

export async function GET() {
  try {
    const xlsxPath = path.join(process.cwd(), 'bildstile.xlsx');
    if (fs.existsSync(xlsxPath)) {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.readFile(xlsxPath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as (string|number)[][];
        if (rows.length >= 2) {
          const headers = rows[0] as string[];
          const stile: Bildstil[] = rows.slice(1).map(r => ({
            id: String(r[headers.indexOf('id')] ?? ''),
            label: String(r[headers.indexOf('label')] ?? ''),
            englisch_prompt: String(r[headers.indexOf('englisch_prompt')] ?? ''),
            beschreibung: String(r[headers.indexOf('beschreibung')] ?? ''),
            kategorie: String(r[headers.indexOf('kategorie')] ?? ''),
          })).filter(s => s.id);
          if (stile.length > 0) return NextResponse.json({ stile, source: 'xlsx' });
        }
      } catch { /* Fallback */ }
    }
    return NextResponse.json({ stile: DEFAULT_STILE, source: 'default' });
  } catch (e) {
    return NextResponse.json({ stile: DEFAULT_STILE, source: 'error', error: String(e) });
  }
}
