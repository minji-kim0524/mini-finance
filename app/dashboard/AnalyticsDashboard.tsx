"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";
import Link from "next/link";
import type { FinanceRow, Report } from "@/types/finance";
import {
  groupByMonth, groupByQuarter, groupBySemiAnnual, groupByYear,
  buildPredictSeries,
} from "@/lib/aggregator";
import { useTheme } from "@/components/ThemeProvider";
import { formatKRW, formatDate, tooltipFmt } from "@/lib/format";

type ChartTab  = "bar" | "predict" | "pie";
type BarPeriod = "monthly" | "quarterly" | "semiannual" | "yearly";

const PIE_COLORS = ["#3b82f6","#34d399","#f87171","#fb923c","#a78bfa","#f472b6","#facc15","#38bdf8","#4ade80","#f97316"];

function renderPieLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (
    cx === undefined || cy === undefined || midAngle === undefined ||
    innerRadius === undefined || outerRadius === undefined || percent === undefined ||
    (percent as number) < 0.05
  ) return null;
  const RADIAN = Math.PI / 180;
  const r = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.5;
  const x = (cx as number) + r * Math.cos(-(midAngle as number) * RADIAN);
  const y = (cy as number) + r * Math.sin(-(midAngle as number) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${((percent as number) * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────

export default function AnalyticsDashboard({
  reports,
  initialRows,
  initialReportId,
}: {
  reports: Report[];
  initialRows: FinanceRow[];
  initialReportId: string | null;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [selectedId, setSelectedId] = useState(initialReportId ?? "");
  const [rows, setRows]             = useState<FinanceRow[]>(initialRows);
  const [loading, setLoading]       = useState(false);
  const [chartTab, setChartTab]     = useState<ChartTab>("bar");
  const [barPeriod, setBarPeriod]   = useState<BarPeriod>("monthly");

  const gridColor   = isDark ? "#1e293b" : "#f1f5f9";
  const tickColor   = isDark ? "#64748b" : "#94a3b8";
  const tooltipStyle = isDark
    ? { borderRadius: "12px", border: "1px solid #334155", fontSize: "12px", backgroundColor: "#1e293b", color: "#f1f5f9" }
    : { borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" };
  const axisTick = { fontSize: 11, fill: tickColor };

  async function handleReportChange(id: string) {
    setSelectedId(id);
    if (!id) { setRows([]); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/reports/${id}/rows`);
      const json = await res.json() as { rows: FinanceRow[] };
      setRows(json.rows);
    } finally {
      setLoading(false);
    }
  }

  const plRows = useMemo(
    () => rows.filter((r) => ["revenue","cogs","expense","non_op_income","non_op_expense"].includes(r.type)),
    [rows],
  );

  const barData = useMemo(() => {
    if (plRows.length === 0) return [];
    if (barPeriod === "quarterly")  return groupByQuarter(plRows);
    if (barPeriod === "semiannual") return groupBySemiAnnual(plRows);
    if (barPeriod === "yearly")     return groupByYear(plRows);
    return groupByMonth(plRows);
  }, [plRows, barPeriod]);

  const predictData = useMemo(() => buildPredictSeries(plRows, 3), [plRows]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of plRows.filter((r) => r.type === "revenue")) {
      map.set(r.account, (map.get(r.account) ?? 0) + r.amount);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [plRows]);

  const totalRevenue = reports.reduce((s, r) => s + r.total_revenue, 0);
  const totalOp      = reports.reduce((s, r) => s + r.operating_profit, 0);
  const avgMargin    = totalRevenue > 0 ? (totalOp / totalRevenue) * 100 : 0;

  const stats = [
    { label: "전체 리포트",     value: `${reports.length}개`,         sub: "업로드된 파일" },
    { label: "총 매출",         value: formatKRW(totalRevenue),        sub: "전체 합산" },
    { label: "총 영업이익",     value: formatKRW(totalOp),            sub: "전체 합산",  color: totalOp  >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500" },
    { label: "평균 영업이익률", value: `${avgMargin.toFixed(1)}%`,    sub: "전체 평균",  color: avgMargin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500" },
  ];

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-20 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">아직 업로드한 내역이 없습니다.</p>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">엑셀 파일을 업로드하면 여기에 표시됩니다.</p>
        <Link href="/dashboard/upload" className="mt-6 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
          첫 파일 업로드하기
        </Link>
      </div>
    );
  }

  const hasChartData = plRows.length > 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-400 dark:text-slate-500">{s.label}</p>
            <p className={`mt-1 text-lg font-bold ${s.color ?? "text-slate-900 dark:text-slate-100"}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">재무 분석</h2>
            <select
              value={selectedId}
              onChange={(e) => handleReportChange(e.target.value)}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-7 text-xs text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {loading && (
              <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
            {([
              { value: "bar",     label: "막대그래프" },
              { value: "predict", label: "추이·예측" },
              { value: "pie",     label: "원형그래프" },
            ] as const).map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setChartTab(t.value)}
                className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition ${
                  chartTab === t.value
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {!hasChartData ? (
            <div className="flex items-center justify-center py-16 text-sm text-slate-400 dark:text-slate-500">
              선택한 리포트에 손익 데이터가 없습니다.
            </div>
          ) : (
            <>
              {chartTab === "bar" && (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">매출 · 매출원가 · 판관비</p>
                    <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
                      {([
                        { value: "monthly",    label: "월별" },
                        { value: "quarterly",  label: "분기" },
                        { value: "semiannual", label: "반기" },
                        { value: "yearly",     label: "연도" },
                      ] as const).map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setBarPeriod(p.value)}
                          className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition ${
                            barPeriod === p.value
                              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} barCategoryGap="30%" barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                      <YAxis
                        tickFormatter={(v) => `${(v / 10000).toLocaleString("ko-KR")}만`}
                        tick={{ fontSize: 11, fill: tickColor }}
                        width={56}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={tooltipFmt} contentStyle={tooltipStyle} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                      <Bar dataKey="revenue" name="매출"     fill="#3b82f6" radius={[4,4,0,0]} />
                      <Bar dataKey="cogs"    name="매출원가" fill="#f87171" radius={[4,4,0,0]} />
                      <Bar dataKey="expense" name="판관비"   fill="#fb923c" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}

              {chartTab === "predict" && (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      실선 = 실적 &nbsp;·&nbsp; 점선 = 3개월 예측 (선형회귀)
                    </p>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      월별
                    </span>
                  </div>
                  {predictData.length < 2 ? (
                    <div className="flex items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500">
                      예측을 위한 데이터가 부족합니다 (최소 2개월 필요)
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={predictData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                        <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                        <YAxis
                          tickFormatter={(v) => `${(v / 10000).toLocaleString("ko-KR")}만`}
                          tick={{ fontSize: 11, fill: tickColor }}
                          width={56}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={tooltipFmt} contentStyle={tooltipStyle} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                        <Line type="monotone" dataKey="revenue"        name="매출 (실적)"      stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={false} />
                        <Line type="monotone" dataKey="profit"         name="영업이익 (실적)"  stroke="#34d399" strokeWidth={2} dot={{ r: 4, fill: "#34d399", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={false} />
                        <Line type="monotone" dataKey="predictRevenue" name="매출 (예측)"      stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: "#93c5fd", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={true} />
                        <Line type="monotone" dataKey="predictProfit"  name="영업이익 (예측)"  stroke="#34d399" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: "#6ee7b7", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </>
              )}

              {chartTab === "pie" && (
                <>
                  <div className="mb-5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">전체 매출 중 계정과목별 비율</p>
                  </div>
                  {pieData.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-sm text-slate-400 dark:text-slate-500">
                      매출 데이터가 없습니다.
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6 sm:flex-row">
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={55}
                            paddingAngle={2}
                            label={renderPieLabel}
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={tooltipFmt} contentStyle={tooltipStyle} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="w-full shrink-0 space-y-2 sm:w-52">
                        {pieData.map((d, i) => {
                          const total = pieData.reduce((s, p) => s + p.value, 0);
                          const pct   = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0";
                          return (
                            <div key={d.name} className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-400">{d.name}</span>
                              <span className="shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">최근 리포트</h2>
          <Link href="/dashboard/reports" className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400">
            전체 보기 →
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {reports.slice(0, 5).map((r) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/${r.id}`}
                className="flex items-center justify-between px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{r.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{formatDate(r.created_at)} · {r.row_count}건</p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <p className="text-xs text-slate-400 dark:text-slate-500">영업이익</p>
                  <p className={`text-sm font-semibold ${r.operating_profit < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
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
            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-center text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            내역 관리 전체 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
