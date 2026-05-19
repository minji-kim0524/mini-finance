import { CreateClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "./AnalyticsDashboard";
import type { FinanceRow } from "@/types/finance";

export default async function DashboardPage() {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: reports } = await supabase
    .from("reports")
    .select("id, name, row_count, total_revenue, gross_profit, operating_profit, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const mostRecent = reports?.[0] ?? null;

  const { data: rows } = mostRecent
    ? await supabase
        .from("finance_rows")
        .select("date, account, amount, type")
        .eq("report_id", mostRecent.id)
        .eq("user_id", user.id)
        .order("date", { ascending: true })
    : { data: [] };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">대시보드</h1>
      <AnalyticsDashboard
        reports={reports ?? []}
        initialRows={(rows ?? []) as FinanceRow[]}
        initialReportId={mostRecent?.id ?? null}
      />
    </div>
  );
}
