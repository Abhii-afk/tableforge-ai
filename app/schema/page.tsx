"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Database,
  Users,
  ShoppingCart,
  Package,
  CreditCard,
  Activity,
  AlertTriangle,
  Search,
  Layers,
  Key,
  BookOpen,
} from "lucide-react";

// ─── Mock Schema Data ────────────────────────────────────────────
interface TableColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

interface TableInfo {
  name: string;
  icon: React.ElementType;
  rowCount: number;
  purpose: string;
  health: "low" | "medium" | "high";
  healthLabel: string;
  keyColumns: TableColumn[];
}

const tables: TableInfo[] = [
  {
    name: "users",
    icon: Users,
    rowCount: 124_530,
    purpose: "Core user accounts and profile data. Primary identity source for the platform.",
    health: "low",
    healthLabel: "Healthy",
    keyColumns: [
      { name: "id", type: "uuid", isPk: true },
      { name: "email", type: "varchar" },
      { name: "status", type: "varchar" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "orders",
    icon: ShoppingCart,
    rowCount: 892_310,
    purpose: "Transaction records linking users to purchased products. Central to revenue analytics.",
    health: "low",
    healthLabel: "Healthy",
    keyColumns: [
      { name: "id", type: "uuid", isPk: true },
      { name: "user_id", type: "uuid", isFk: true },
      { name: "amount", type: "numeric" },
      { name: "status", type: "varchar" },
    ],
  },
  {
    name: "products",
    icon: Package,
    rowCount: 3_480,
    purpose: "Product catalog with pricing, categories, and inventory tracking.",
    health: "low",
    healthLabel: "Healthy",
    keyColumns: [
      { name: "id", type: "uuid", isPk: true },
      { name: "name", type: "varchar" },
      { name: "price", type: "numeric" },
      { name: "category", type: "varchar" },
    ],
  },
  {
    name: "subscriptions",
    icon: CreditCard,
    rowCount: 41_200,
    purpose: "Recurring billing plans. Tracks plan tier, renewal dates, and churn status.",
    health: "medium",
    healthLabel: "Needs Review",
    keyColumns: [
      { name: "id", type: "uuid", isPk: true },
      { name: "user_id", type: "uuid", isFk: true },
      { name: "plan", type: "varchar" },
      { name: "expires_at", type: "timestamp" },
    ],
  },
  {
    name: "events",
    icon: Activity,
    rowCount: 12_450_000,
    purpose: "Raw analytics event stream. High-volume append-only log of user interactions.",
    health: "medium",
    healthLabel: "High Volume",
    keyColumns: [
      { name: "id", type: "bigint", isPk: true },
      { name: "user_id", type: "uuid", isFk: true },
      { name: "event_type", type: "varchar" },
      { name: "payload", type: "jsonb" },
    ],
  },
  {
    name: "legacy_users",
    icon: AlertTriangle,
    rowCount: 8_920,
    purpose: "Deprecated user table from v1. Contains active records despite its name — handle with care.",
    health: "high",
    healthLabel: "Legacy Risk",
    keyColumns: [
      { name: "id", type: "serial", isPk: true },
      { name: "username", type: "varchar" },
      { name: "last_login", type: "timestamp" },
    ],
  },
];

// ─── Components ──────────────────────────────────────────────────

function SchemaOverview() {
  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
  const riskyCount = tables.filter((t) => t.health === "high").length;

  return (
    <Card className="bg-card border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
            <Layers className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Database Overview</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              This database powers a <span className="text-zinc-200 font-medium">SaaS e-commerce platform</span>. 
              It tracks user accounts, orders, products, and subscriptions. 
              The <span className="text-zinc-200 font-medium">users</span> and <span className="text-zinc-200 font-medium">orders</span> tables 
              are the most critical — they drive revenue analytics and churn detection. 
              The <span className="text-red-400 font-medium">legacy_users</span> table contains 
              active records from v1 and should be migrated or deprecated.
            </p>
            <div className="flex items-center gap-6 text-xs text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span className="text-zinc-300 font-medium">{tables.length}</span> tables
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span className="text-zinc-300 font-medium">{(totalRows / 1_000_000).toFixed(1)}M</span> total rows
              </span>
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 font-medium">{riskyCount}</span> legacy / risky
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TableCard({ table }: { table: TableInfo }) {
  return (
    <Card className="bg-card border-zinc-800 hover:border-zinc-700 group hover:-translate-y-0.5 transition-all duration-300">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 group-hover:bg-zinc-800/50 transition-all">
            <table.icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold font-mono">{table.name}</CardTitle>
            <p className="text-xs text-zinc-500 mt-0.5">
              {table.rowCount.toLocaleString()} rows
            </p>
          </div>
        </div>
        <Badge variant={table.health}>{table.healthLabel}</Badge>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">{table.purpose}</p>

        <div className="flex flex-col gap-1.5 bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Key Columns</p>
          {table.keyColumns.map((col) => (
            <div key={col.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-zinc-300 font-mono">
                {col.isPk ? (
                  <Key className="w-3 h-3 text-amber-500" />
                ) : col.isFk ? (
                  <Key className="w-3 h-3 text-blue-400" />
                ) : (
                  <span className="w-3 h-3 inline-block" />
                )}
                {col.name}
              </span>
              <span className="text-zinc-600 font-mono">{col.type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function SchemaStoryPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return tables;
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.purpose.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-6xl mx-auto w-full">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <BookOpen className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Schema Story</h1>
          </div>
          <p className="text-zinc-400 text-sm ml-[52px]">An intelligent overview of your database structure, health, and purpose.</p>
        </header>

        <div className="flex flex-col gap-6">
          <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <SchemaOverview />
          </div>

          {/* Search */}
          <div className="relative max-w-md animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Filter tables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-900/50"
            />
          </div>

          {/* Table Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t, i) => (
              <div key={t.name} className="animate-fade-in" style={{ animationDelay: `${150 + i * 50}ms` }}>
                <TableCard table={t} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-zinc-600" />
              </div>
              <h3 className="text-zinc-400 font-medium mb-1">No tables found</h3>
              <p className="text-zinc-500 text-sm">Try adjusting your search term.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
