import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  const { filePath, folderPath } = await req.json();
  const target = filePath || folderPath;
  if (!target) return NextResponse.json({ error: 'Kein Pfad angegeben' }, { status: 400 });

  return new Promise<NextResponse>((resolve) => {
    let cmd: string;
    if (filePath && fs.existsSync(filePath)) {
      cmd = `explorer /select,"${path.win32.normalize(filePath)}"`;
    } else {
      const dir = folderPath || path.dirname(filePath);
      cmd = `explorer "${path.win32.normalize(dir)}"`;
    }
    exec(cmd, (err) => {
      if (err) resolve(NextResponse.json({ error: String(err) }, { status: 500 }));
      else resolve(NextResponse.json({ ok: true }));
    });
  });
}
