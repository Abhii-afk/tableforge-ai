import { Pool, PoolClient } from "pg";
import crypto from "crypto";

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

interface Column {
  name: string;
  type: string;
  constraints: ('PK' | 'FK' | 'NN' | 'U')[];
  fkRef?: { table: string; column: string };
}

interface Table {
  name: string;
  columns: Column[];
}

interface SchemaSnapshot {
  tables: Table[];
}

interface SessionData {
  client: PoolClient;
  pool: Pool;
  schemaSnapshot: SchemaSnapshot;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private sessions: Map<string, SessionData> = new Map();

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async testConnection(config: DatabaseConfig): Promise<boolean> {
    const pool = new Pool(config);
    try {
      const client = await pool.connect();
      client.release();
      await pool.end();
      return true;
    } catch (error) {
      await pool.end();
      return false;
    }
  }

  async connect(config: DatabaseConfig): Promise<{ sessionId: string; schemaSnapshot: SchemaSnapshot }> {
    const pool = new Pool(config);
    let client: PoolClient | null = null;

    try {
      client = await pool.connect();
      const sessionId = crypto.randomUUID();
      const schemaSnapshot = await this.introspect(client);
      this.sessions.set(sessionId, { client, pool, schemaSnapshot });
      return { sessionId, schemaSnapshot };
    } catch (error) {
      if (client) {
        client.release();
      }
      await pool.end().catch(() => {});
      const detail =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to connect to database: ${detail}`);
    }
  }

  async introspect(client: PoolClient): Promise<SchemaSnapshot> {
    try {
      // Get user tables
      const tablesQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('pg_stat_statements', 'pg_buffercache') -- exclude some system-like tables if needed
      `;
      const tablesResult = await client.query<any>(tablesQuery);
      const tables: Table[] = [];

      for (const row of tablesResult.rows) {
        const tableName = row.table_name;

        // Get columns
        const columnsQuery = `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `;
        const columnsResult = await client.query<any>(columnsQuery, [tableName]);

        // Get primary keys
        const pkQuery = `
          SELECT kcu.column_name
          FROM information_schema.key_column_usage kcu
          JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
          WHERE kcu.table_name = $1
          AND tc.constraint_type = 'PRIMARY KEY'
        `;
        const pkResult = await client.query<any>(pkQuery, [tableName]);
        const pkColumns = new Set(pkResult.rows.map((r: any) => r.column_name));

        // Get foreign keys
        const fkQuery = `
          SELECT kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
          FROM information_schema.key_column_usage kcu
          JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
          JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
          JOIN information_schema.key_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
          WHERE kcu.table_name = $1
          AND tc.constraint_type = 'FOREIGN KEY'
        `;
        const fkResult = await client.query<any>(fkQuery, [tableName]);
        const fkMap = new Map<string, { table: string; column: string }>();
        fkResult.rows.forEach((r: any) => {
          fkMap.set(r.column_name, { table: r.referenced_table, column: r.referenced_column });
        });

        // Get unique constraints
        const uniqueQuery = `
          SELECT kcu.column_name
          FROM information_schema.key_column_usage kcu
          JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
          WHERE kcu.table_name = $1
          AND tc.constraint_type = 'UNIQUE'
        `;
        const uniqueResult = await client.query<any>(uniqueQuery, [tableName]);
        const uniqueColumns = new Set(uniqueResult.rows.map((r: any) => r.column_name));

        const columns: Column[] = columnsResult.rows.map((col: any) => {
          const constraints: ('PK' | 'FK' | 'NN' | 'U')[] = [];
          if (pkColumns.has(col.column_name)) constraints.push('PK');
          if (fkMap.has(col.column_name)) constraints.push('FK');
          if (col.is_nullable === 'NO') constraints.push('NN');
          if (uniqueColumns.has(col.column_name)) constraints.push('U');

          const column: Column = {
            name: col.column_name,
            type: col.data_type,
            constraints
          };

          if (fkMap.has(col.column_name)) {
            column.fkRef = fkMap.get(col.column_name);
          }

          return column;
        });

        tables.push({ name: tableName, columns });
      }

      return { tables };
    } catch (error) {
      throw new Error(`Failed to introspect database: ${error}`);
    }
  }

  async execute(sessionId: string, sql: string, timeoutMs = 5000): Promise<{ rows: any[]; fields: any[] }> {
    if (!sql.trim().toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries allowed');
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    try {
      await session.client.query('SET LOCAL statement_timeout = $1', [timeoutMs]);
      const result = await session.client.query<any>(sql);
      return { rows: result.rows, fields: result.fields || [] };
    } catch {
      throw new Error('Query execution failed');
    }
  }

  async disconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        session.client.release();
      } catch {
        // ignore
      }
      try {
        await session.pool.end();
      } catch {
        // ignore
      }
      this.sessions.delete(sessionId);
    }
  }

  getSchemaSnapshot(sessionId: string): SchemaSnapshot | null {
    const session = this.sessions.get(sessionId);
    return session ? session.schemaSnapshot : null;
  }
}