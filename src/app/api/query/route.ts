import { NextRequest, NextResponse } from 'next/server';
import { TranslationService } from '@/lib/ai/TranslationService';
import { DatabaseService } from '@/lib/db/DatabaseService';

const dbService = DatabaseService.getInstance();

function getSessionIdFromHeaders(request: NextRequest): string | null {
  return (
    request.headers.get('x-session-id') ??
    request.headers.get('sessionid') ??
    null
  );
}

function isTranslationError(
  value: unknown
): value is { error: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'string'
  );
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = getSessionIdFromHeaders(request);
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    let body: { nlInput?: unknown };
    try {
      body = (await request.json()) as { nlInput?: unknown };
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const nlInput =
      typeof body.nlInput === 'string' ? body.nlInput.trim() : '';
    if (!nlInput) {
      return NextResponse.json({ error: 'Missing nlInput' }, { status: 400 });
    }

    const schemaSnapshot = dbService.getSchemaSnapshot(sessionId);
    if (!schemaSnapshot) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const translationService = new TranslationService();
    const embedding = await translationService.embed(nlInput);
    const ragContext: { nl: string; sql: string }[] = [];

    const result = await translationService.translate({
      nlInput,
      schemaSnapshot,
      ragContext,
      sessionHistory: [],
    });

    if (isTranslationError(result)) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json(
      {
        ...result,
        embedding,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Query translation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
