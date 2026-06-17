"use client";

// ssr: false는 Client Component에서만 허용
// recharts를 서버 번들에서 제외 → 콜드 스타트 단축, LCP 개선
import dynamic from "next/dynamic";
import type { Report, FinanceRow } from "@/types/finance";

const AnalyticsDashboard = dynamic(() => import("./AnalyticsDashboard"), {
  ssr: false,
  loading: () => (
    <div className="flex h-60 items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-400 dark:text-slate-500">차트 불러오는 중…</p>
    </div>
  ),
});

export default function DashboardChart({
  reports,
  initialRows,
  initialReportId,
}: {
  reports: Report[];
  initialRows: FinanceRow[];
  initialReportId: string;
}) {
  return (
    <AnalyticsDashboard
      reports={reports}
      initialRows={initialRows}
      initialReportId={initialReportId}
    />
  );
}
