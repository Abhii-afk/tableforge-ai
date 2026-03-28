import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/DatabaseService';

const dbService = DatabaseService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    await dbService.disconnect(sessionId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Disconnect failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
