import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RelationshipVisualizer } from "@/components/RelationshipVisualizer";

export default function RelationsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-8 max-w-7xl mx-auto w-full h-screen overflow-hidden">
        <header className="mb-6 shrink-0">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Schema Relations</h1>
          <p className="text-zinc-400">Visualize and explore the structural relationships of your database tables.</p>
        </header>

        <div className="flex-1 min-h-0 w-full rounded-2xl">
          <RelationshipVisualizer />
        </div>
      </div>
    </DashboardLayout>
  );
}
