import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/db/DatabaseService';

const dbService = DatabaseService.getInstance();

interface ConnectBody {
  host: string;
  port: number | string;
  database: string;
  user: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConnectBody;
    const { host, port, database, user, password } = body;

    if (!host || !port || !database || !user || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const config = {
      host,
      port: Number(port),
      database,
      user,
      password,
    };

    const { sessionId, schemaSnapshot } = await dbService.connect(config);

    return NextResponse.json({ sessionId, schemaSnapshot, schemaStory: null, anomalies: [] }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to establish database connection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}