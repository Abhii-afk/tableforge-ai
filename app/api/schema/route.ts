import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/DatabaseService';

const dbService = DatabaseService.getInstance();

interface SchemaBody {
  sessionId?: string;
}

async function getSessionId(request: NextRequest): Promise<string | null> {
  const sessionIdFromHeader = request.headers.get('x-session-id');
  if (sessionIdFromHeader) return sessionIdFromHeader;

  if (request.method === 'POST') {
    const body = (await request.json()) as SchemaBody;
    return body?.sessionId ?? null;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = await getSessionId(request);
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const schemaSnapshot = dbService.getSchemaSnapshot(sessionId);
    if (!schemaSnapshot) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ schemaSnapshot }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get schema snapshot';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
