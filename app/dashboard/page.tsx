import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { calcPLSummary } from "@/lib/aggregator";
import type { FinanceRow } from "@/types/finance";

const SUMMARY_LABELS: { key: keyof ReturnType<typeof calcPLSummary>; label: string }[] = [
  { key: "totalRevenue", label: "총 매출" },
  { key: "totalCogs", label: "매출원가" },
  { key: "grossProfit", label: "매출총이익" },
  { key: "totalExpense", label: "판관비" },
  { key: "operatingProfit", label: "영업이익" },
];

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rows } = await supabase
    .from("finance_rows")
    .select("date, account, amount, type")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  const financeRows = (rows ?? []) as FinanceRow[];
  const summary = financeRows.length > 0 ? calcPLSummary(financeRows) : null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">대시보드</h1>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
          </div>
          <Link
            href="/upload"
            className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            파일 업로드
          </Link>
        </div>

        {summary ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-800">
              손익 요약{" "}
              <span className="text-sm font-normal text-slate-400">
                ({financeRows.length}건)
              </span>
            </h2>
            <dl className="space-y-2">
              {SUMMARY_LABELS.map(({ key, label }) => (
                <div key={key} className="flex justify-between text-sm">
                  <dt className="text-slate-500">{label}</dt>
                  <dd
                    className={`font-semibold ${
                      summary[key] < 0 ? "text-red-500" : "text-slate-900"
                    }`}
                  >
                    {formatKRW(summary[key])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-500">아직 데이터가 없습니다.</p>
            <p className="mt-1 text-sm text-slate-400">엑셀 파일을 업로드하면 손익이 여기에 표시됩니다.</p>
            <Link
              href="/upload"
              className="mt-6 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              첫 파일 업로드하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
