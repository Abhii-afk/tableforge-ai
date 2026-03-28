import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HistorySummary } from "@/components/HistorySummary";
import { HistoryList } from "@/components/HistoryList";
import { Clock } from "lucide-react";

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-6 lg:p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Query History</h1>
          </div>
          <p className="text-zinc-400 text-sm ml-[52px]">Browse, search, and re-run past queries.</p>
        </header>

        <div className="flex flex-col gap-8">
          <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <HistorySummary total={42} successful={36} risky={4} />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <HistoryList />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
