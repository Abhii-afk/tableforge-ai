import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/DatabaseService';

const dbService = DatabaseService.getInstance();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body?.sessionId;
    const sql = body?.sql;

    if (!sessionId || !sql) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await dbService.execute(sessionId, sql);
    return NextResponse.json({ rows: result.rows, fields: result.fields }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Query execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
