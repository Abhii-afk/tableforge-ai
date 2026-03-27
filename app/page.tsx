"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QueryBar } from "@/components/QueryBar";
import { LiveGrid } from "@/components/LiveGrid";
import { SqlPreviewCard } from "@/components/SqlPreviewCard";

function HomeContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || undefined;
  const [sqlStatus, setSqlStatus] = useState<'idle' | 'generating' | 'preview' | 'executing' | 'executed'>('idle');

  // Simulated SQL response data
  const mockGeneratedSql = `SELECT 
  id, name, email, status, last_login, revenue
FROM users
WHERE status = 'churned'
  AND created_at >= CURRENT_DATE - INTERVAL '1 month'
ORDER BY revenue DESC;`;
  
  const mockExplanation = "This query fetches all users who churned within the last month, ordered by their total historical revenue from highest to lowest.";

  const handleGenerate = (query: string, mode: 'nl' | 'sql') => {
    // If they write SQL directly, logic might skip NL generation, but for this workflow we assume NL flow
    setSqlStatus('generating');
    
    // Simulate AI generation time
    setTimeout(() => {
      setSqlStatus('preview');
    }, 1500);
  };

  const handleRunQuery = () => {
    setSqlStatus('executing');
    
    // Simulate DB query execution
    setTimeout(() => {
      setSqlStatus('executed');
    }, 800);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Query Editor</h1>
          <p className="text-zinc-400">Ask questions in plain English or write SQL directly.</p>
        </header>

        <div className="w-full max-w-5xl flex flex-col gap-6">
          <QueryBar 
            onGenerate={handleGenerate} 
            isGenerating={sqlStatus === 'generating'}
            initialQuery={initialQuery}
          />
          
          {/* SQL Preview appears after generation */}
          {sqlStatus === 'preview' && (
            <SqlPreviewCard 
              sql={mockGeneratedSql}
              explanation={mockExplanation}
              risk="low"
              onRun={handleRunQuery}
              isExecuting={false}
            />
          )}

          {/* Keeps the preview card up but disabled while executing */}
          {sqlStatus === 'executing' && (
            <SqlPreviewCard 
              sql={mockGeneratedSql}
              explanation={mockExplanation}
              risk="low"
              onRun={handleRunQuery}
              isExecuting={true}
            />
          )}
          
          <LiveGrid 
            hasRunQuery={sqlStatus === 'executed'}
            isExecuting={sqlStatus === 'executing'}
          />
        </div>
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
