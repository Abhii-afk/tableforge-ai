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

    const schemaSnapshot = dbService.getSchemaSnapshot(sessionId);
    if (!schemaSnapshot) {
      return NextResponse.json({ error: 'Session not found' }, { status: 400 });
    }

    return NextResponse.json({ schemaSnapshot }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Schema lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const schemaSnapshot = dbService.getSchemaSnapshot(sessionId);
    if (!schemaSnapshot) {
      return NextResponse.json({ error: 'Session not found' }, { status: 400 });
    }

    return NextResponse.json({ schemaSnapshot }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Schema lookup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
