import { CreateClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "./AnalyticsDashboard";
import { UpgradeBanner } from "@/app/utils/ReportCards";
import type { FinanceRow } from "@/types/finance";

export default async function DashboardPage() {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: reports }, { data: sub }] = await Promise.all([
    supabase
      .from("reports")
      .select("id, name, row_count, total_revenue, gross_profit, operating_profit, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
  ]);

  const plan = sub?.plan ?? "free";

  const mostRecent = reports?.[0] ?? null;

  const { data: rows } = mostRecent
    ? await supabase
        .from("finance_rows")
        .select("date, account, amount, type")
        .eq("report_id", mostRecent.id)
        .eq("user_id", user.id)
        .order("date", { ascending: true })
    : { data: [] };

  const atLimit = plan === "free" && (reports?.length ?? 0) >= 3;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">대시보드</h1>
        {plan === "pro" ? (
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Pro
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            무료
          </span>
        )}
      </div>
      {atLimit && <UpgradeBanner />}
      <AnalyticsDashboard
        reports={reports ?? []}
        initialRows={(rows ?? []) as FinanceRow[]}
        initialReportId={mostRecent?.id ?? null}
      />
    </div>
  );
}
