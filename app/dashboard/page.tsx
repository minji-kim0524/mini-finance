import Link from "next/link";
import { redirect } from "next/navigation";
import { UpgradeBanner } from "@/app/utils/ReportCards";
import type { FinanceRow } from "@/types/finance";
import { GetUser, GetSubscription, CreateClient } from "@/lib/supabase/server";
import DashboardChart from "./DashboardChart";

export default async function DashboardPage() {
  const supabase = await CreateClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  // auth 검증과 reports 조회를 병렬 실행
  const [user, { data: reports }] = await Promise.all([
    GetUser(),
    supabase
      .from("reports")
      .select("id, name, row_count, total_revenue, gross_profit, operating_profit, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false }),
  ]);
  if (!user) redirect("/auth/login");

  const sub = await GetSubscription(user.id);
  const plan = sub?.plan ?? "free";

  // 리포트 없음 → 서버에서 빈 상태 직접 렌더링 (recharts 로드 불필요, LCP 텍스트가 SSR HTML에 포함)
  if (!reports || reports.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">대시보드</h1>
            {plan === "pro" ? (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pro</span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">무료</span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            업로드한 재무 데이터를 기반으로 손익 현황과 월별 추이를 한눈에 확인합니다.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-20 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">아직 업로드한 내역이 없습니다.</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">엑셀 파일을 업로드하면 여기에 표시됩니다.</p>
          <Link
            href="/dashboard/upload"
            className="mt-6 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            첫 파일 업로드하기
          </Link>
        </div>
      </div>
    );
  }

  // 리포트 있음 → 최근 리포트의 행 데이터 조회 후 차트 렌더링
  const atLimit = plan === "free" && reports.length >= 3;
  const mostRecent = reports[0];
  const { data: rows } = await supabase
    .from("finance_rows")
    .select("date, account, amount, type")
    .eq("report_id", mostRecent.id)
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">대시보드</h1>
          {plan === "pro" ? (
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pro</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">무료</span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          업로드한 재무 데이터를 기반으로 손익 현황과 월별 추이를 한눈에 확인합니다.
        </p>
      </div>
      {atLimit && <UpgradeBanner />}
      <DashboardChart
        reports={reports}
        initialRows={(rows ?? []) as FinanceRow[]}
        initialReportId={mostRecent.id}
      />
    </div>
  );
}
