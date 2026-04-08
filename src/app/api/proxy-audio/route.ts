import { NextRequest, NextResponse } from 'next/server';

// Proxy fuer externe Audio-URLs (ElevenLabs preview etc.)
// Noetig wegen Cross-Origin-Embedder-Policy: require-corp
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !url.startsWith('https://')) {
    return NextResponse.json({ error: 'url fehlt oder ungueltig' }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get('content-type') || 'audio/mpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cross-Origin-Resource-Policy': 'same-origin',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
