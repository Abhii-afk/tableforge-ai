import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HistorySummary } from "@/components/HistorySummary";
import { HistoryList } from "@/components/HistoryList";

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Query History</h1>
          <p className="text-zinc-400">Browse, search, and re-run past queries.</p>
        </header>

        <div className="flex flex-col gap-8">
          <HistorySummary total={42} successful={36} risky={4} />
          <HistoryList />
        </div>
      </div>
    </DashboardLayout>
  );
}
