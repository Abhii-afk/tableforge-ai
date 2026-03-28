"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronLeft, ChevronRight, Database,
  X, Columns2, Link, ChevronDown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────
type QueryResultRow = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Churned" | "Pending";
  lastLogin: string;
  revenue: number;
  user_id?: string | null;
  is_active?: boolean | null;
  deleted_at?: null;
};

// ─── Mock data ────────────────────────────────────────────────────
const mockData: QueryResultRow[] = [
  { id: "usr_9kx2", name: "Alice Freeman",  email: "alice@acme.co",         status: "Active",  lastLogin: "2025-01-29T14:32:00Z", revenue: 4500,  user_id: "org_42", is_active: true,  deleted_at: null },
  { id: "usr_2m5p", name: "Bob Smith",      email: "bsmith@globex.inc",      status: "Churned", lastLogin: "2024-11-14T09:11:00Z", revenue: 1200,  user_id: "org_17", is_active: false, deleted_at: null },
  { id: "usr_7x1z", name: "Carol Davis",    email: "carol.d@initrode.io",    status: "Active",  lastLogin: "2025-01-29T13:00:00Z", revenue: 8900,  user_id: "org_42", is_active: true,  deleted_at: null },
  { id: "usr_4y9b", name: "Dave Wilson",    email: "dwilson@initech.com",    status: "Pending", lastLogin: "2025-01-01T08:00:00Z", revenue: 0,     user_id: null,     is_active: null,  deleted_at: null },
  { id: "usr_1a8c", name: "Eve Xu",         email: "eve@soylent.corp",       status: "Active",  lastLogin: "2025-01-27T18:45:00Z", revenue: 15400, user_id: "org_91", is_active: true,  deleted_at: null },
  { id: "usr_6t3r", name: "Frank Miller",   email: "frank@massive.com",      status: "Churned", lastLogin: "2024-02-03T10:20:00Z", revenue: 300,   user_id: "org_17", is_active: false, deleted_at: null },
];

// ─── Value formatters ─────────────────────────────────────────────
function formatDatetime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} · ${hours}:${minutes} UTC`;
}

function isoLike(v: string) {
  return /\d{4}-\d{2}-\d{2}T/.test(v);
}

function getRowIdentifier(row: QueryResultRow): string {
  const idValue = row.id;
  if (typeof idValue === "string" && idValue.trim()) {
    return idValue;
  }
  return "unknown";
}

// ─── Column helper ────────────────────────────────────────────────
const columnHelper = createColumnHelper<QueryResultRow>();

// ─── Column definitions ───────────────────────────────────────────
// Note: no explicit type annotation — TS infers correctly from columnHelper
const COLUMNS = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (i) => <span className="text-zinc-500 font-mono text-xs">{i.getValue() as string}</span>,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (i) => <span className="font-medium text-zinc-200">{i.getValue() as string}</span>,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (i) => <span className="text-zinc-400">{i.getValue() as string}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (i) => {
      const s = i.getValue() as string;
      return (
        <span className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium border",
          s === "Active"  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          s === "Churned" ? "bg-red-500/10 text-red-400 border-red-500/20" :
          "bg-amber-500/10 text-amber-400 border-amber-500/20"
        )}>
          {s}
        </span>
      );
    },
  }),
  columnHelper.accessor("lastLogin", {
    header: "Last Login",
    cell: (i) => {
      const v = i.getValue() as string;
      return <span className="text-zinc-400 text-sm whitespace-nowrap">{isoLike(v) ? formatDatetime(v) : v}</span>;
    },
  }),
  columnHelper.accessor("revenue", {
    header: "Revenue",
    cell: (i) => <span className="text-zinc-300 font-mono">${(i.getValue() as number).toLocaleString()}</span>,
  }),
  columnHelper.accessor("user_id", {
    header: "User ID",
    cell: (i) => {
      const v = i.getValue();
      if (v === null || v === undefined) return <span className="italic text-zinc-600 text-xs">null</span>;
      return (
        <span className="flex items-center gap-1 text-blue-400 font-mono text-xs">
          <Link className="w-3 h-3 shrink-0" />{v as string}
        </span>
      );
    },
  }),
  columnHelper.accessor("is_active", {
    header: "Active",
    cell: (i) => {
      const v = i.getValue();
      if (v === null || v === undefined) return <span className="italic text-zinc-600 text-xs">null</span>;
      return v
        ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">true</span>
        : <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-500 border border-zinc-700">false</span>;
    },
  }),
  columnHelper.accessor("deleted_at", {
    header: "Deleted At",
    cell: () => <span className="italic text-zinc-600 text-xs">null</span>,
  }),
];

// ─── Column visibility dropdown ───────────────────────────────────
function ColumnVisibilityDropdown({
  table,
}: {
  table: ReturnType<typeof useReactTable<QueryResultRow>>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors"
      >
        <Columns2 className="w-3.5 h-3.5" />
        Columns
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-20 w-44 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          <div className="px-3 py-2 border-b border-zinc-800/60">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Toggle Columns</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {table.getAllColumns().map((col) => {
              if (!col.getCanHide()) return null;
              const visible = col.getIsVisible();
              return (
                <button
                  key={col.id}
                  onClick={() => col.toggleVisibility(!visible)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <span className="font-mono">{col.id}</span>
                  {visible && <Check className="w-3 h-3 text-accent" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Row Detail Panel ─────────────────────────────────────────────
function RowDetailPanel({
  row,
  onClose,
}: {
  row: QueryResultRow;
  onClose: () => void;
}) {
  const fields = row
    ? (Object.entries(row) as [keyof QueryResultRow, QueryResultRow[keyof QueryResultRow]][])
    : [];

  function renderValue(key: string, value: QueryResultRow[keyof QueryResultRow]) {
    // null / undefined
    if (value === null || value === undefined) {
      return <span className="italic text-slate-400 dark:text-zinc-600 text-sm">null</span>;
    }
    // boolean
    if (typeof value === "boolean") {
      return value
        ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">true</span>
        : <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-500 border border-slate-200 dark:border-zinc-700">false</span>;
    }
    // ISO date strings
    if (typeof value === "string" && isoLike(value)) {
      return <span className="text-sm text-slate-900 dark:text-zinc-200 font-medium">{formatDatetime(value)}</span>;
    }
    // FK-like strings (underscore + looks like an id)
    if (key.endsWith("_id") && typeof value === "string") {
      return (
        <span className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 text-sm font-medium">
          <Link className="w-3.5 h-3.5 shrink-0" />{value}
        </span>
      );
    }
    // Number
    if (typeof value === "number") {
      return <span className="text-sm text-slate-900 dark:text-zinc-200 font-medium font-mono">{value.toLocaleString()}</span>;
    }
    // Default string
    return <span className="text-sm text-slate-900 dark:text-zinc-200 font-medium">{String(value)}</span>;
  }

  return (
    <div className="w-[300px] shrink-0 flex flex-col border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-fade-in">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-zinc-800/60 shrink-0">
        <p className="font-mono font-bold text-sm text-slate-900 dark:text-zinc-100">Row {getRowIdentifier(row)}</p>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300 transition-colors"
          aria-label="Close row detail panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {fields.map(([key, val]) => (
          <div
            key={key}
            className="px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors"
          >
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono uppercase tracking-wider mb-1">{key}</p>
            {renderValue(key, val)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Author attribution row ───────────────────────────────────────
function AuthorRow({ rowCount }: { rowCount: number }) {
  return (
    <div className="flex items-center justify-between px-1 py-2">
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span className="text-emerald-400 font-medium">{rowCount} rows</span>
          <span className="text-zinc-600">returned</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <span>Run by</span>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-[9px] text-accent font-bold leading-none">RS</span>
          </div>
          <span className="text-zinc-400 font-medium">RS</span>
        </div>
        <span className="text-zinc-600">·</span>
        <span>just now</span>
      </div>
    </div>
  );
}

// ─── Main LiveGrid ────────────────────────────────────────────────
export interface LiveGridProps {
  hasRunQuery?: boolean;
  isExecuting?: boolean;
}

export function LiveGrid({ hasRunQuery = false, isExecuting = false }: LiveGridProps) {
  const [data] = useState(() => [...mockData]);
  const [selectedRow, setSelectedRow] = useState<QueryResultRow | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns: COLUMNS,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  });

  if (isExecuting) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 border border-zinc-800 rounded-xl bg-zinc-900/30 min-h-[320px] animate-pulse">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-accent rounded-full animate-spin mb-6" />
        <h3 className="text-lg font-medium text-zinc-300">Running Query...</h3>
        <p className="text-sm mt-2 text-zinc-500">Fetching live data from the database.</p>
      </div>
    );
  }

  if (!hasRunQuery) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 text-zinc-500 min-h-[320px]">
        <Database className="w-10 h-10 text-zinc-700 mb-4" />
        <h3 className="text-lg font-medium text-zinc-300">No Results Yet</h3>
        <p className="text-sm mt-2 max-w-xs text-center text-zinc-500">Run a query above to see live results in the grid.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2 animate-fade-in">
      {/* Author attribution */}
      <AuthorRow rowCount={data.length} />

      {/* Table + panel wrapper */}
      <div className="relative flex w-full overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800/70 bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl">
        {/* Table area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar row */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800/60 bg-slate-100/60 dark:bg-zinc-900/30">
            <p className="text-[11px] text-slate-500 dark:text-zinc-600">Click a row to inspect ·  Drag column headers to reorder</p>
            <ColumnVisibilityDropdown table={table} />
          </div>

          {/* Table scroll container */}
          <div className="overflow-x-auto scrollbar-dark">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400 sticky top-0 z-10">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th key={h.id} className="px-5 py-3 font-medium tracking-wide text-xs uppercase">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {table.getRowModel().rows.map((row) => {
                  const isSelected = selectedRow === row.original;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRow(isSelected ? null : row.original)}
                      aria-selected={isSelected}
                      className={cn(
                        "transition-colors duration-150 cursor-pointer border-l-2",
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-500/10 border-l-blue-500"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.02] border-l-transparent"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3.5">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-zinc-800/60 bg-slate-100/60 dark:bg-zinc-950/50">
            <p className="text-xs text-slate-500 dark:text-zinc-600">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1 rounded bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1 rounded bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row detail panel drawer */}
        {selectedRow && (
          <RowDetailPanel
            row={selectedRow}
            onClose={() => setSelectedRow(null)}
          />
        )}
      </div>
    </div>
  );
}
