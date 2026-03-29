'use client';

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';

type ConnectResponse = {
  sessionId?: string;
  schemaSnapshot?: { tables?: unknown[] };
  error?: string;
};

type QueryPreviewResponse = {
  sql: string;
  explanation: string;
  operation: string;
  risk: 'low' | 'medium' | 'high';
  riskReason: string;
  embedding?: number[];
  error?: string;
};

function riskClass(risk: string): 'low' | 'medium' | 'high' {
  if (risk === 'low' || risk === 'medium' || risk === 'high') return risk;
  return 'medium';
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [schemaTableCount, setSchemaTableCount] = useState<number | null>(
    null
  );
  const [connectLoading, setConnectLoading] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [userInput, setUserInput] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryPreviewResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      setConnectLoading(true);
      setConnectError(null);
      try {
        const res = await fetch('/api/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = (await res.json()) as ConnectResponse;
        if (!res.ok) {
          throw new Error(data.error || `Connect failed (${res.status})`);
        }
        if (!data.sessionId) {
          throw new Error('No sessionId in connect response');
        }
        if (!cancelled) {
          setSessionId(data.sessionId);
          const tables = data.schemaSnapshot?.tables;
          setSchemaTableCount(
            Array.isArray(tables) ? tables.length : null
          );
        }
      } catch (e) {
        if (!cancelled) {
          setConnectError(
            e instanceof Error ? e.message : 'Failed to connect to database'
          );
        }
      } finally {
        if (!cancelled) setConnectLoading(false);
      }
    }

    connect();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!sessionId || !userInput.trim()) return;

      setQueryLoading(true);
      setQueryError(null);
      setResult(null);

      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          },
          body: JSON.stringify({ nlInput: userInput.trim() }),
        });
        const data = (await res.json()) as QueryPreviewResponse & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || `Query failed (${res.status})`);
        }
        if ('error' in data && data.error && !data.sql) {
          throw new Error(data.error);
        }
        setResult(data);
      } catch (e) {
        setQueryError(
          e instanceof Error ? e.message : 'Something went wrong'
        );
      } finally {
        setQueryLoading(false);
      }
    },
    [sessionId, userInput]
  );

  const canQuery =
    Boolean(sessionId) && !connectLoading && !connectError && userInput.trim();

  return (
    <main>
      <h1>Tableforge AI</h1>
      <p className="subtitle">
        Ask questions in plain English. The app opens a DB session on load,
        then sends your text to the AI for SQL preview.
      </p>

      {connectLoading && (
        <div className="status-banner loading" role="status">
          Connecting to the database…
        </div>
      )}

      {!connectLoading && connectError && (
        <div className="status-banner error" role="alert">
          <strong>Connection error.</strong> {connectError} Ensure Postgres is
          running and <code style={{ fontSize: '0.85em' }}>.env</code> has{' '}
          <code style={{ fontSize: '0.85em' }}>DB_HOST</code>,{' '}
          <code style={{ fontSize: '0.85em' }}>DB_PORT</code>,{' '}
          <code style={{ fontSize: '0.85em' }}>DB_NAME</code>,{' '}
          <code style={{ fontSize: '0.85em' }}>DB_USER</code>,{' '}
          <code style={{ fontSize: '0.85em' }}>DB_PASSWORD</code>.
        </div>
      )}

      {!connectLoading && sessionId && !connectError && (
        <div className="status-banner success" role="status">
          Session active
          {schemaTableCount !== null
            ? ` · schema snapshot: ${schemaTableCount} table${
                schemaTableCount === 1 ? '' : 's'
              }`
            : ''}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="nl-input">Natural language query</label>
        <textarea
          id="nl-input"
          name="nlInput"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="e.g. List all users who placed an order last month"
          disabled={!sessionId || Boolean(connectError) || connectLoading}
          aria-busy={queryLoading}
        />
        <button
          type="submit"
          disabled={!canQuery || queryLoading}
        >
          {queryLoading ? 'Generating…' : 'Generate SQL'}
        </button>
      </form>

      {queryError && (
        <div className="query-error" role="alert">
          {queryError}
        </div>
      )}

      {result && (
        <>
          <h2 className="section-title">SQL</h2>
          <div className="results">
            <pre>{result.sql}</pre>
            <p className="explanation">{result.explanation}</p>
            <div className="risk-row">
              <span
                className={`risk-badge ${riskClass(result.risk)}`}
              >
                Risk: {result.risk}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                {result.riskReason}
              </span>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
