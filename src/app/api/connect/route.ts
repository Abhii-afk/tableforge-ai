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
    const body = (await request.json()) as Partial<ConnectBody> | null;
    const host = body?.host || process.env.DB_HOST;
    const portValue = body?.port ?? process.env.DB_PORT;
    const database = body?.database || process.env.DB_NAME;
    const user = body?.user || process.env.DB_USER;
    const password = body?.password || process.env.DB_PASSWORD;

    const missing = [];
    if (!host) missing.push('DB_HOST or host');
    if (!portValue) missing.push('DB_PORT or port');
    if (!database) missing.push('DB_NAME or database');
    if (!user) missing.push('DB_USER or user');
    if (!password) missing.push('DB_PASSWORD or password');
    if (missing.length) {
      return NextResponse.json({ error: `Missing config: ${missing.join(', ')}` }, { status: 400 });
    }

    const port = Number(portValue);
    if (Number.isNaN(port) || port <= 0) {
      return NextResponse.json({ error: 'Invalid port value' }, { status: 400 });
    }

    const config = {
      host: host as string,
      port,
      database: database as string,
      user: user as string,
      password: password as string,
    };

    const { sessionId, schemaSnapshot } = await dbService.connect(config);

    return NextResponse.json({ sessionId, schemaSnapshot }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to connect';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
