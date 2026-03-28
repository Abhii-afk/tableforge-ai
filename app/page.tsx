"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QueryBar } from "@/components/QueryBar";
import { LiveGrid } from "@/components/LiveGrid";
import { SqlPreviewCard } from "@/components/SqlPreviewCard";
import { Sparkles } from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || undefined;
  const [sqlStatus, setSqlStatus] = useState<'idle' | 'generating' | 'preview' | 'executing' | 'executed'>('idle');

  const mockGeneratedSql = `SELECT 
  id, name, email, status, last_login, revenue
FROM users
WHERE status = 'churned'
  AND created_at >= CURRENT_DATE - INTERVAL '1 month'
ORDER BY revenue DESC;`;
  
  const mockExplanation = "This query fetches all users who churned within the last month, ordered by their total historical revenue from highest to lowest.";

  const handleGenerate = (query: string, mode: 'nl' | 'sql') => {
    setSqlStatus('generating');
    setTimeout(() => setSqlStatus('preview'), 1500);
  };

  const handleRunQuery = () => {
    setSqlStatus('executing');
    setTimeout(() => setSqlStatus('executed'), 800);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-6 lg:p-8 w-full">
        {/* Header + query bar — constrained width */}
        <div className="max-w-5xl mx-auto w-full">
          <header className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Query Editor</h1>
            </div>
            <p className="text-zinc-400 text-sm ml-[52px]">Ask questions in plain English or write SQL directly.</p>
          </header>

          <div className="w-full flex flex-col gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <QueryBar
              onGenerate={handleGenerate}
              isGenerating={sqlStatus === 'generating'}
              initialQuery={initialQuery}
            />

            {(sqlStatus === 'preview' || sqlStatus === 'executing') && (
              <div className="animate-fade-in">
                <SqlPreviewCard
                  sql={mockGeneratedSql}
                  explanation={mockExplanation}
                  risk="low"
                  onRun={handleRunQuery}
                  isExecuting={sqlStatus === 'executing'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Results grid — full width so side panel can appear */}
        {sqlStatus === 'executed' && (
          <div className="mt-6 animate-fade-in w-full">
            <LiveGrid hasRunQuery={true} isExecuting={false} />
          </div>
        )}

        {sqlStatus === 'executing' && (
          <div className="mt-6 w-full max-w-5xl mx-auto">
            <LiveGrid hasRunQuery={false} isExecuting={true} />
          </div>
        )}

        {sqlStatus === 'idle' && (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-zinc-600" />
            </div>
            <h3 className="text-zinc-300 font-medium text-lg mb-1">Ready to query</h3>
            <p className="text-zinc-500 text-sm max-w-sm">
              Type a natural language question above and press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300 text-xs border border-zinc-700 mx-0.5">⌘ Enter</kbd> to generate SQL.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
