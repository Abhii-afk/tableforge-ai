import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Home() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col p-8 max-w-5xl mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Query Editor</h1>
          <p className="text-zinc-400">Ask questions in plain English or write SQL directly.</p>
        </header>

        <div className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900/50 p-6 flex flex-col items-center justify-center text-zinc-500">
          <div className="w-12 h-12 border border-zinc-700 bg-zinc-800 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="font-medium text-zinc-300">Natural Language Query Bar Placeholder</p>
          <p className="text-sm mt-1">Connect to a database to start asking questions.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
