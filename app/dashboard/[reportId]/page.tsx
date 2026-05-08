import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { calcPLSummary } from "@/lib/aggregator";
import type { AccountType, FinanceRow, PLSummary } from "@/types/finance";
import MonthlyChart from "../MonthlyChart";
import UserMenu from "@/components/UserMenu";

type SummaryLabel = {
  key: keyof PLSummary;
  label: string;
  type?: AccountType;
  separator?: boolean;
};

const SUMMARY_LABELS: SummaryLabel[] = [
  { key: "totalRevenue",    label: "총 매출",    type: "revenue" },
  { key: "totalCogs",       label: "매출원가",   type: "cogs" },
  { key: "grossProfit",     label: "매출총이익", separator: true },
  { key: "totalExpense",    label: "판관비",     type: "expense" },
  { key: "operatingProfit", label: "영업이익",   separator: true },
];

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function groupByTypeAndAccount(rows: FinanceRow[]): Map<AccountType, Map<string, number>> {
  const map = new Map<AccountType, Map<string, number>>();
  for (const row of rows) {
    if (!map.has(row.type)) map.set(row.type, new Map());
    const inner = map.get(row.type)!;
    inner.set(row.account, (inner.get(row.account) ?? 0) + row.amount);
  }
  return map;
}

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

  const { data: rows } = await supabase
    .from("finance_rows")
    .select("date, account, amount, type")
    .eq("report_id", reportId)
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  const financeRows = (rows ?? []) as FinanceRow[];
  const summary = financeRows.length > 0 ? calcPLSummary(financeRows) : null;
  const breakdown = groupByTypeAndAccount(financeRows);

  const uploadDate = new Date(report.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="mb-1 flex items-center gap-1 text-xs text-slate-400 transition hover:text-slate-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              내역 목록
            </Link>
            <h1 className="truncate text-xl font-semibold text-slate-900">{report.name}</h1>
            <p className="text-xs text-slate-400">{uploadDate}</p>
          </div>
          <div className="ml-4 shrink-0">
            <UserMenu
              name={user.user_metadata?.name ?? null}
              email={user.email ?? ""}
            />
          </div>
        </div>

        <MonthlyChart rows={financeRows} />

        {summary ? (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-800">
                손익 요약{" "}
                <span className="text-sm font-normal text-slate-400">
                  ({financeRows.length}건)
                </span>
              </h2>
              <dl className="space-y-2">
                {SUMMARY_LABELS.map(({ key, label, type, separator }) => (
                  <div key={key}>
                    {separator && <div className="my-3 border-t border-slate-100" />}
                    <div className="flex justify-between text-sm">
                      <dt className={type ? "text-slate-500" : "font-medium text-slate-700"}>
                        {label}
                      </dt>
                      <dd className={`font-semibold ${summary[key] < 0 ? "text-red-500" : "text-slate-900"}`}>
                        {formatKRW(summary[key])}
                      </dd>
                    </div>
                    {type && breakdown.get(type) && (
                      <div className="mt-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
                        {Array.from(breakdown.get(type)!.entries()).map(([account, amount]) => (
                          <div key={account} className="flex justify-between text-xs">
                            <span className="text-slate-400">{account}</span>
                            <span className="text-slate-400">{formatKRW(amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </dl>
            </div>

            {breakdown.get("other") && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h2 className="mb-3 text-base font-semibold text-amber-800">미분류 항목</h2>
                <p className="mb-3 text-xs text-amber-600">자동 분류되지 않은 계정과목입니다. 직접 확인이 필요합니다.</p>
                <div className="space-y-1">
                  {Array.from(breakdown.get("other")!.entries()).map(([account, amount]) => (
                    <div key={account} className="flex justify-between text-sm">
                      <span className="text-amber-700">{account}</span>
                      <span className="font-medium text-amber-800">{formatKRW(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">데이터를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
