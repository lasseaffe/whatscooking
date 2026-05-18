import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let lastContext: Record<string, unknown> | null = null;

export async function POST(request: Request) {
  try {
    lastContext = await request.json();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid JSON' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ context: lastContext });
}
