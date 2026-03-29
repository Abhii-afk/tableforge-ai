'use client';

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [schemaTableCount, setSchemaTableCount] = useState<number | null>(null);
  const [connectLoading, setConnectLoading] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [userInput, setUserInput] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryPreviewResponse | null>(null);
  const [copied, setCopied] = useState(false);

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
          setSchemaTableCount(Array.isArray(tables) ? tables.length : null);
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
    return () => { cancelled = true; };
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
        const data = (await res.json()) as QueryPreviewResponse & { error?: string };
        if (!res.ok) {
          throw new Error(data.error || `Query failed (${res.status})`);
        }
        if ('error' in data && data.error && !data.sql) {
          throw new Error(data.error);
        }
        setResult(data);
      } catch (e) {
        setQueryError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setQueryLoading(false);
      }
    },
    [sessionId, userInput]
  );

  const handleCopy = () => {
    if (!result?.sql) return;
    navigator.clipboard.writeText(result.sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const canQuery =
    Boolean(sessionId) && !connectLoading && !connectError && userInput.trim();

  const riskConfig = {
    low: {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      text: '#15803d',
      dot: '#22c55e',
      label: 'Low Risk',
      icon: '✓',
    },
    medium: {
      bg: '#fefce8',
      border: '#fde68a',
      text: '#92400e',
      dot: '#f59e0b',
      label: 'Medium Risk',
      icon: '!',
    },
    high: {
      bg: '#fff1f2',
      border: '#fecdd3',
      text: '#991b1b',
      dot: '#ef4444',
      label: 'High Risk',
      icon: '⚠',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pt-12 pb-8 px-4 sm:px-6"
      style={{ backgroundColor: '#f8fafc' }}
    >
      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="text-center mb-10"
        >
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-2"
            style={{ color: '#0f172a', letterSpacing: '-0.02em' }}
          >
            Tableforge <span style={{ color: '#334155' }}>AI</span>
          </h1>
          <p className="text-sm font-medium" style={{ color: '#94a3b8' }}>
            Natural language → SQL, instantly.
          </p>
          {/* subtle divider */}
          <div
            className="mx-auto mt-6"
            style={{
              width: 40,
              height: 2,
              borderRadius: 9999,
              backgroundColor: '#e2e8f0',
            }}
          />
        </motion.div>

        {/* Session Badge */}
        <AnimatePresence>
          {!connectLoading && sessionId && !connectError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="flex justify-center mb-6"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                }}
              >
                {/* pulsing dot */}
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                </span>
                Session active
                {schemaTableCount !== null
                  ? ` · ${schemaTableCount} table${schemaTableCount === 1 ? '' : 's'} loaded`
                  : ''}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error / Loading states */}
        <AnimatePresence>
          {connectLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center mb-6"
              style={{ color: '#94a3b8' }}
            >
              <div
                className="animate-spin rounded-full border-2 border-t-transparent mb-2"
                style={{
                  width: 24,
                  height: 24,
                  borderColor: '#cbd5e1 transparent transparent transparent',
                }}
              />
              <p className="text-xs">Connecting to database…</p>
            </motion.div>
          )}
          {!connectLoading && connectError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#991b1b',
              }}
            >
              <span>⚠</span>
              <span><strong>Connection Error:</strong> {connectError}</span>
            </motion.div>
          )}
          {queryError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
              style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#991b1b',
              }}
            >
              <span>⚠</span>
              <span>{queryError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="rounded-2xl p-6 sm:p-7 mb-6"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
            border: '1px solid #e2e8f0',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-2.5">
              <label
                htmlFor="nl-input"
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#94a3b8', letterSpacing: '0.08em' }}
              >
                Your Query
              </label>
              {userInput.length > 0 && (
                <span className="text-xs" style={{ color: '#cbd5e1' }}>
                  {userInput.length} chars
                </span>
              )}
            </div>
            <textarea
              id="nl-input"
              name="nlInput"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g., Show me all users who placed an order last month and spent more than $100"
              disabled={!sessionId || Boolean(connectError) || connectLoading}
              rows={4}
              className="w-full px-4 py-3 rounded-xl resize-none text-sm transition-all duration-200 focus:outline-none mb-4"
              style={{
                backgroundColor: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                color: '#0f172a',
                fontFamily: 'inherit',
                lineHeight: '1.6',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(148,163,184,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#cbd5e1' }}>
                Press Generate or hit Ctrl + Enter
              </span>
              <motion.button
                type="submit"
                disabled={!canQuery || queryLoading}
                whileHover={{ scale: !canQuery || queryLoading ? 1 : 1.02 }}
                whileTap={{ scale: !canQuery || queryLoading ? 1 : 0.98 }}
                transition={{ duration: 0.12 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#334155',
                  boxShadow: '0 2px 6px rgba(51,65,85,0.2)',
                }}
                onMouseEnter={(e) => {
                  if (!(!canQuery || queryLoading))
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e293b';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#334155';
                }}
              >
                {queryLoading && (
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.5) transparent transparent transparent' }}
                  />
                )}
                {queryLoading ? 'Generating…' : 'Generate SQL'}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* ── Output Section ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10"
            >
              {/* Left: SQL + Curator Notes */}
              <div className="lg:col-span-2 space-y-4">

                {/* SQL Block */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.06 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {/* SQL card top bar */}
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: '#94a3b8', letterSpacing: '0.08em' }}
                      >
                        Generated SQL
                      </span>
                      {result.operation && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {result.operation}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="text-xs font-medium px-3 py-1 rounded-lg transition-all duration-150"
                      style={{
                        color: copied ? '#15803d' : '#94a3b8',
                        backgroundColor: copied ? '#f0fdf4' : 'transparent',
                        border: `1px solid ${copied ? '#bbf7d0' : '#e2e8f0'}`,
                      }}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-5">
                    <pre
                      className="rounded-xl px-5 py-4 text-sm overflow-x-auto leading-relaxed"
                      style={{
                        backgroundColor: '#f8fafc',
                        color: '#334155',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        border: '1px solid #e2e8f0',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {result.sql}
                    </pre>
                  </div>
                </motion.div>

                {/* Curator Notes */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.14 }}
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-xs font-semibold uppercase tracking-widest"
                      style={{ color: '#94a3b8', letterSpacing: '0.08em' }}
                    >
                      Curator Notes
                    </span>
                    <div style={{ flex: 1, height: 1, backgroundColor: '#f1f5f9' }} />
                  </div>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: '#475569' }}
                  >
                    {result.explanation}
                  </p>
                </motion.div>
              </div>

              {/* Right: Risk Audit */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pt-1 mb-1">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: '#94a3b8', letterSpacing: '0.08em' }}
                  >
                    Risk Audit
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                </div>

                {/* Active risk highlight */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28 }}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: riskConfig[riskClass(result.risk)].bg,
                    border: `1px solid ${riskConfig[riskClass(result.risk)].border}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: riskConfig[riskClass(result.risk)].dot }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: riskConfig[riskClass(result.risk)].text }}
                    >
                      {riskConfig[riskClass(result.risk)].label}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                    {result.riskReason || 'No additional notes'}
                  </p>
                </motion.div>

                {/* Staggered risk legend cards */}
                <div className="space-y-2 pt-1">
                  {(Object.entries(riskConfig) as [string, typeof riskConfig['low']][]).map(
                    ([key, cfg], idx) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: 0.18 + idx * 0.08 }}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                        style={{
                          backgroundColor: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cfg.dot }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: cfg.text }}
                        >
                          {cfg.label}
                        </span>
                        <span
                          className="ml-auto text-xs font-bold"
                          style={{ color: cfg.text, opacity: 0.6 }}
                        >
                          {cfg.icon}
                        </span>
                      </motion.div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="text-center text-xs pb-2"
        style={{ color: '#e2e8f0' }}
      >
        Tableforge AI · v2.4.0
      </motion.footer>
    </motion.div>
  );
}
