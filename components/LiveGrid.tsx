"use client";

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ServerCrash, Database } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data Types
type QueryResultRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  lastLogin: string;
  revenue: number;
};

const columnHelper = createColumnHelper<QueryResultRow>();

const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => <span className="text-zinc-500 font-mono text-xs">{info.getValue()}</span>,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => <span className="font-medium text-zinc-200">{info.getValue()}</span>,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => <span className="text-zinc-400">{info.getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue() as string;
      return (
        <span className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium border",
          status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          status === "Churned" ? "bg-red-500/10 text-red-400 border-red-500/20" :
          "bg-amber-500/10 text-amber-400 border-amber-500/20"
        )}>
          {status}
        </span>
      );
    },
  }),
  columnHelper.accessor("lastLogin", {
    header: "Last Login",
    cell: (info) => <span className="text-zinc-400 text-sm whitespace-nowrap">{info.getValue()}</span>,
  }),
  columnHelper.accessor("revenue", {
    header: "Revenue",
    cell: (info) => <span className="text-zinc-300 font-mono">${info.getValue().toLocaleString()}</span>,
  }),
];

const mockData: QueryResultRow[] = [
  { id: "usr_9kx2", name: "Alice Freeman", email: "alice@acme.co", status: "Active", lastLogin: "10 mins ago", revenue: 4500 },
  { id: "usr_2m5p", name: "Bob Smith", email: "bsmith@globex.inc", status: "Churned", lastLogin: "2 months ago", revenue: 1200 },
  { id: "usr_7x1z", name: "Carol Davis", email: "carol.d@initrode.io", status: "Active", lastLogin: "1 hour ago", revenue: 8900 },
  { id: "usr_4y9b", name: "Dave Wilson", email: "dwilson@initech.com", status: "Pending", lastLogin: "Never", revenue: 0 },
  { id: "usr_1a8c", name: "Eve Xu", email: "eve@soylent.corp", status: "Active", lastLogin: "2 days ago", revenue: 15400 },
  { id: "usr_6t3r", name: "Frank Miller", email: "frank@massive.com", status: "Churned", lastLogin: "1 year ago", revenue: 300 },
];

export interface LiveGridProps {
  hasRunQuery?: boolean;
  isExecuting?: boolean;
}

export function LiveGrid({ hasRunQuery = false, isExecuting = false }: LiveGridProps) {
  const [data] = useState(() => [...mockData]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 5 },
    },
  });

  if (isExecuting) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 border border-zinc-800 rounded-xl bg-zinc-900/30 min-h-[400px] animate-pulse">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-accent rounded-full animate-spin mb-6" />
        <h3 className="text-lg font-medium text-zinc-300">Running Query...</h3>
        <p className="text-sm mt-2 text-zinc-500">Fetching live data from the database.</p>
      </div>
    );
  }

  if (!hasRunQuery) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 text-zinc-500 min-h-[400px]">
        <Database className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-lg font-medium text-zinc-300">No Query Results</h3>
        <p className="text-sm mt-2 max-w-sm text-center">Run a query from the editor above to see the results displayed in the live grid.</p>
      </div>
    );
  }

  return (
    <div className="w-full relative group flex flex-col items-center">
      {/* Container */}
      <div className="w-full bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Table Header Wrapper for Scroll styling */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/50 border-b border-white/5 text-zinc-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-4 font-medium tracking-wide">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/5">
              {table.getRowModel().rows.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-white/[0.02] transition-colors duration-200 group/row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer controls */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-zinc-950/50">
          <div className="text-xs text-zinc-500 flex items-center">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Live sync active
            </span>
            <span className="mx-3 text-zinc-700">|</span>
            <span>Showing {table.getRowModel().rows.length} of {data.length} rows</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
