import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QueryBar } from "@/components/QueryBar";
import { LiveGrid } from "@/components/LiveGrid";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Query Editor</h1>
          <p className="text-zinc-400">Ask questions in plain English or write SQL directly.</p>
        </header>

        <div className="w-full max-w-5xl space-y-8">
          <QueryBar />
          <LiveGrid />
        </div>
      </div>
    </DashboardLayout>
  );
}
