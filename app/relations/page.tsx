"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RelationshipVisualizer } from "@/components/RelationshipVisualizer";

export default function RelationsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-6 w-full h-screen overflow-hidden">
        <header className="mb-4 shrink-0">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Relations</h1>
          <p className="text-zinc-400 text-sm">
            Explore how tables are connected. Click any edge to inspect the foreign key relationship.
          </p>
        </header>

        <div className="flex-1 min-h-0 w-full">
          <RelationshipVisualizer />
        </div>
      </div>
    </DashboardLayout>
  );
}
