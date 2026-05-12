import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { FinanceRow } from "@/types/finance";
import ReportViewer from "./ReportViewer";

export default async function ReportDashboardPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: report } = await supabase
    .from("reports")
    .select("id, name, created_at")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .single();

  if (!report) redirect("/dashboard");

  const [{ data: rows }, { data: allReports }] = await Promise.all([
    supabase
      .from("finance_rows")
      .select("date, account, amount, type")
      .eq("report_id", reportId)
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
    supabase
      .from("reports")
      .select("id, name, created_at")
      .eq("user_id", user.id)
      .neq("id", reportId)
      .order("created_at", { ascending: false }),
  ]);

  const financeRows = (rows ?? []) as FinanceRow[];
  const otherReports = (allReports ?? []) as { id: string; name: string; created_at: string }[];

  const uploadDate = new Date(report.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/reports"
          className="mb-2 flex items-center gap-1 text-xs text-slate-400 transition hover:text-slate-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          내역 목록
        </Link>
        <h1 className="truncate text-xl font-semibold text-slate-900">{report.name}</h1>
        <p className="text-xs text-slate-400">{uploadDate}</p>
      </div>

      <ReportViewer rows={financeRows} reportName={report.name} otherReports={otherReports} />
    </div>
  );
}
