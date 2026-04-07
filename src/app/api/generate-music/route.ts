import { NextRequest, NextResponse } from 'next/server';
import { createMusicTask } from '@/lib/kie-ai';

export async function POST(req: NextRequest) {
  const { description, duration, instrumental } = await req.json();
  try {
    const taskId = await createMusicTask(description || 'upbeat background music for social media', duration || 30);
    return NextResponse.json({ taskId });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
