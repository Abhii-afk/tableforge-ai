"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RelationshipVisualizer } from "@/components/RelationshipVisualizer";
import { Network, Sun, Moon } from "lucide-react";

// ── Skeleton placeholder ──────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800">
      <div className="flex flex-col items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center animate-pulse">
          <Network className="w-6 h-6 text-slate-700" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-36 h-28 rounded-xl bg-slate-900 border border-slate-800 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        <p className="text-xs text-slate-600 animate-pulse">Loading schema...</p>
      </div>
    </div>
  );
}

// ── Theme toggle button ───────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark"
        ? <Sun className="w-4 h-4" />
        : <Moon className="w-4 h-4" />
      }
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function RelationsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-6 w-full h-screen overflow-hidden">
        <header className="mb-4 shrink-0 animate-fade-in flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Network className="w-5 h-5 text-accent" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Relations</h1>
            </div>
            <p className="text-zinc-400 text-sm ml-[52px]">
              Interactive ER diagram — drag nodes, draw connections, click edges to inspect.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1 min-h-0 w-full">
          {loading
            ? <LoadingSkeleton />
            : (
              <div className="h-full w-full animate-fade-in">
                <RelationshipVisualizer />
              </div>
            )
          }
        </div>
      </div>
    </DashboardLayout>
  );
}
