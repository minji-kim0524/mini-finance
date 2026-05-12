"use client";

import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import Link from "next/link";

interface Report {
  id: string;
  name: string;
  row_count: number;
  total_revenue: number;
  gross_profit: number;
  operating_profit: number;
  created_at: string;
}

function formatKRW(n: number) {
  const abs = Math.abs(n);
  if (abs >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (abs >= 10_000) return `${Math.round(n / 10_000).toLocaleString("ko-KR")}만원`;
  return n.toLocaleString("ko-KR") + "원";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AnalyticsDashboard({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-500">아직 업로드한 내역이 없습니다.</p>
        <p className="mt-1 text-sm text-slate-400">엑셀 파일을 업로드하면 여기에 표시됩니다.</p>
        <Link
          href="/upload"
          className="mt-6 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          첫 파일 업로드하기
        </Link>
      </div>
    );
  }

  const totalRevenue = reports.reduce((s, r) => s + r.total_revenue, 0);
  const totalOperating = reports.reduce((s, r) => s + r.operating_profit, 0);
  const avgMargin = totalRevenue > 0 ? (totalOperating / totalRevenue) * 100 : 0;

  const stats = [
    { label: "전체 리포트", value: `${reports.length}개`, sub: "업로드된 파일" },
    { label: "총 매출", value: formatKRW(totalRevenue), sub: "전체 합산" },
    {
      label: "총 영업이익",
      value: formatKRW(totalOperating),
      sub: "전체 합산",
      color: totalOperating >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "평균 영업이익률",
      value: `${avgMargin.toFixed(1)}%`,
      sub: "전체 평균",
      color: avgMargin >= 0 ? "text-emerald-600" : "text-red-500",
    },
  ];

  const chartData = reports.slice(0, 7).map((r) => ({
    name: r.name.length > 7 ? r.name.slice(0, 7) + "…" : r.name,
    매출: r.total_revenue,
    매출총이익: r.gross_profit,
    영업이익: r.operating_profit,
  }));

  const recentReports = reports.slice(0, 5);

  return (
    <div className="space-y-5">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`mt-1 text-lg font-bold ${s.color ?? "text-slate-900"}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 리포트별 손익 비교 차트 */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-slate-800">리포트별 손익 비교</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="30%" barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${(v / 10000).toLocaleString("ko-KR")}만`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              width={52}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: unknown) =>
                typeof value === "number" ? value.toLocaleString("ko-KR") + "원" : String(value)
              }
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
            />
            <Bar dataKey="매출" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="매출총이익" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="영업이익" fill="#f87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 최근 리포트 */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-sm font-semibold text-slate-800">최근 리포트</h2>
          <Link
            href="/dashboard/reports"
            className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
          >
            전체 보기 →
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {recentReports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/${r.id}`}
                className="flex items-center justify-between px-5 py-3.5 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDate(r.created_at)} · {r.row_count}건
                  </p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <p className="text-xs text-slate-400">영업이익</p>
                  <p
                    className={`text-sm font-semibold ${
                      r.operating_profit < 0 ? "text-red-500" : "text-emerald-600"
                    }`}
                  >
                    {formatKRW(r.operating_profit)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="px-5 pb-5 pt-3">
          <Link
            href="/dashboard/reports"
            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-center text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            내역 관리 전체 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
