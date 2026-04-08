import { NextRequest, NextResponse } from 'next/server';
import { getTaskStatus, getCredits, getVeoTaskStatus } from '@/lib/kie-ai';
import { getGenerationStatus as getHedraStatus } from '@/lib/hedra';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  const isVeo = searchParams.get('veo') === '1';
  const isHedra = searchParams.get('hedra') === '1';

  // Credits-Check Sonderfall
  if (taskId === 'credits_check') {
    try {
      const credits = await getCredits();
      return NextResponse.json({ credits, state: 'success' });
    } catch {
      return NextResponse.json({ credits: null, state: 'error' });
    }
  }

  if (!taskId) return NextResponse.json({ error: 'taskId fehlt' }, { status: 400 });

  try {
    const status = isHedra
      ? await getHedraStatus(taskId)
      : isVeo
      ? await getVeoTaskStatus(taskId)
      : await getTaskStatus(taskId);
    return NextResponse.json(status);
  } catch (e) {
    return NextResponse.json({ error: String(e), state: 'fail' }, { status: 500 });
  }
}
