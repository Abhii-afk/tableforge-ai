"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TerminalSquare, BookOpen, Clock, Network, Database } from "lucide-react";

const sidebarItems = [
  { name: "Query", href: "/", icon: TerminalSquare },
  { name: "Schema Story", href: "/schema", icon: BookOpen },
  { name: "Query History", href: "/history", icon: Clock },
  { name: "Relations", href: "/relations", icon: Network },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700">
          <Database className="w-4 h-4 text-zinc-300" />
        </div>
        <span className="font-semibold text-lg tracking-tight">TableForge AI</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-400 font-medium mb-1">Database Connected</p>
          <p className="text-xs text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            PostgreSQL • production
          </p>
        </div>
      </div>
    </aside>
  );
}
