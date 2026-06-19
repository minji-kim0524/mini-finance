"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import type { FinanceRow, Report } from "@/types/finance";
import {
  GroupByMonth, GroupByQuarter, GroupBySemiAnnual, GroupByYear,
  BuildPredictSeries,
} from "@/lib/aggregator";
import { UseTheme } from "@/components/ThemeProvider";
import { FormatKRW, FormatDate, TooltipFmt } from "@/lib/format";
import {
  pieColors, RenderPieLabel, GetChartTheme, BuildStats, TabSwitcher, EmptyChartMessage,
} from "@/app/utils/analyticsUtils";

type ChartTab  = "bar" | "predict" | "pie";
type BarPeriod = "monthly" | "quarterly" | "semiannual" | "yearly";

const chartTabs = [
  { value: "bar",     label: "막대그래프" },
  { value: "predict", label: "추이·예측" },
  { value: "pie",     label: "원형그래프" },
] as const;

const periodTabs = [
  { value: "monthly",    label: "월별" },
  { value: "quarterly",  label: "분기" },
  { value: "semiannual", label: "반기" },
  { value: "yearly",     label: "연도" },
] as const;

export default function AnalyticsDashboard({
  reports,
  initialRows,
  initialReportId,
}: {
  reports: Report[];
  initialRows: FinanceRow[];
  initialReportId: string | null;
}) {
  const { theme } = UseTheme();
  const { gridColor, tickColor, tooltipStyle, axisTick } = GetChartTheme(theme === "dark");

  const [selectedId, setSelectedId] = useState(initialReportId ?? "");
  const [rows, setRows]             = useState<FinanceRow[]>(initialRows);
  const [loading, setLoading]       = useState(false);
  const [chartTab, setChartTab]     = useState<ChartTab>("bar");
  const [barPeriod, setBarPeriod]   = useState<BarPeriod>("monthly");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [predictYear, setPredictYear]   = useState<string>("");

  async function HandleReportChange(id: string) {
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

  const availableYears = useMemo(() => {
    const years = new Set(plRows.map((r) => r.date.slice(0, 4)));
    return Array.from(years).sort();
  }, [plRows]);

  const effectiveYear = (selectedYear && availableYears.includes(selectedYear))
    ? selectedYear
    : (availableYears[availableYears.length - 1] ?? "");

  const predictEffectiveYear = (predictYear && availableYears.includes(predictYear))
    ? predictYear
    : (availableYears[availableYears.length - 1] ?? "");

  const barData = useMemo(() => {
    if (plRows.length === 0) return [];
    const filterable = barPeriod !== "yearly" && availableYears.length >= 2;
    const rows = filterable ? plRows.filter((r) => r.date.slice(0, 4) === effectiveYear) : plRows;
    if (barPeriod === "quarterly")  return GroupByQuarter(rows);
    if (barPeriod === "semiannual") return GroupBySemiAnnual(rows);
    if (barPeriod === "yearly")     return GroupByYear(rows);
    return GroupByMonth(rows);
  }, [plRows, barPeriod, effectiveYear, availableYears]);

  const predictData = useMemo(() => {
    const source = availableYears.length >= 2
      ? plRows.filter((r) => r.date.slice(0, 4) === predictEffectiveYear)
      : plRows;
    return BuildPredictSeries(source, 3);
  }, [plRows, availableYears, predictEffectiveYear]);

  const predictXInterval = Math.max(0, Math.floor(predictData.length / 12) - 1);
  const predictMinWidth  = predictData.length * 65 + 56;

  const barChartRef = useRef<HTMLDivElement>(null);
  const [predictXPadding, setPredictXPadding] = useState(0);

  useEffect(() => {
    if (chartTab !== "bar") return;
    const raf = requestAnimationFrame(() => {
      const tick = barChartRef.current?.querySelector<Element>(".recharts-cartesian-axis-tick");
      if (!tick) return;
      const m = /translate\(([^,)\s]+)/.exec(tick.getAttribute("transform") ?? "");
      // YAxis(56) + 차트 기본 margin.left(5) = 61px offset 제거
      if (m) setPredictXPadding(Math.round(parseFloat(m[1])) - 61);
    });
    return () => cancelAnimationFrame(raf);
  }, [chartTab, barData]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of plRows.filter((r) => r.type === "revenue")) {
      map.set(r.account, (map.get(r.account) ?? 0) + r.amount);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [plRows]);

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

  const stats = BuildStats(reports);

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
              onChange={(e) => HandleReportChange(e.target.value)}
              disabled={loading}
              aria-label="분석할 리포트 선택"
              className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-7 text-xs text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {loading && (
              <span role="status" aria-label="데이터 불러오는 중">
                <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </span>
            )}
          </div>
          <TabSwitcher tabs={chartTabs} active={chartTab} onChange={setChartTab} label="차트 유형 선택" />
        </div>

        <div className="p-6">
          {plRows.length === 0 ? (
            <EmptyChartMessage>선택한 리포트에 손익 데이터가 없습니다.</EmptyChartMessage>
          ) : (
            <>
              {chartTab === "bar" && (
                <>
                  <div className="mb-5 flex items-start justify-between">
                    <p className="pt-1.5 text-xs text-slate-500 dark:text-slate-400">매출 · 매출원가 · 판관비</p>
                    <div className="flex flex-col items-end gap-2">
                      <TabSwitcher tabs={periodTabs} active={barPeriod} onChange={setBarPeriod} label="기간 선택" />
                      {barPeriod !== "yearly" && availableYears.length >= 2 && (
                        <TabSwitcher
                          tabs={availableYears.map((y) => ({ value: y, label: `${y}년` }))}
                          active={effectiveYear}
                          onChange={setSelectedYear}
                        />
                      )}
                    </div>
                  </div>
                  <div ref={barChartRef}>
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
                      <Tooltip formatter={TooltipFmt} contentStyle={tooltipStyle} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                      <Bar dataKey="revenue" name="매출"     fill="#0066cc" radius={0} />
                      <Bar dataKey="cogs"    name="매출원가" fill="#dc3545" radius={0} />
                      <Bar dataKey="expense" name="판관비"   fill="#FF8C00" radius={0} />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </>
              )}

              {chartTab === "predict" && (
                <>
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex flex-col items-start gap-2">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        월별 · 3개월 예측 (선형회귀)
                      </span>
                      {availableYears.length >= 2 && (
                        <TabSwitcher
                          tabs={availableYears.map((y) => ({ value: y, label: `${y}년` }))}
                          active={predictEffectiveYear}
                          onChange={setPredictYear}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <svg width="24" height="10" className="shrink-0"><line x1="0" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth="2" /></svg>
                        실적
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg width="24" height="10" className="shrink-0"><line x1="0" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" /></svg>
                        예측
                      </span>
                    </div>
                  </div>
                  {predictData.length < 2 ? (
                    <EmptyChartMessage className="py-12">예측을 위한 데이터가 부족합니다 (최소 2개월 필요)</EmptyChartMessage>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                      <div style={{ minWidth: predictMinWidth }}>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={predictData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                          <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} interval={predictXInterval} padding={{ left: predictXPadding, right: predictXPadding }} />
                          <YAxis
                            tickFormatter={(v) => `${(v / 10000).toLocaleString("ko-KR")}만`}
                            tick={{ fontSize: 11, fill: tickColor }}
                            width={56}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const hasActual = payload.some(
                                (p) => !String(p.dataKey ?? "").startsWith("predict") && p.value != null,
                              );
                              const items = payload.filter(
                                (p) =>
                                  p.value != null &&
                                  (hasActual
                                    ? !String(p.dataKey ?? "").startsWith("predict")
                                    : String(p.dataKey ?? "").startsWith("predict")),
                              );
                              if (!items.length) return null;
                              return (
                                <div style={{ ...tooltipStyle, padding: "8px 12px" }}>
                                  <p style={{ marginBottom: 4, fontWeight: 600 }}>{String(label ?? "")}</p>
                                  {items.map((p) => (
                                    <p key={String(p.dataKey ?? "")} style={{ margin: "2px 0" }}>
                                      <span style={{ color: p.color }}>● </span>
                                      {String(p.name ?? "")}:{" "}
                                      {typeof p.value === "number" ? p.value.toLocaleString("ko-KR") + "원" : ""}
                                    </p>
                                  ))}
                                </div>
                              );
                            }}
                          />
                          <Line type="monotone" dataKey="revenue"        name="매출 (실적)"     stroke="#0066cc" strokeWidth={2} dot={{ r: 4, fill: "#0066cc", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={false} />
                          <Line type="monotone" dataKey="cogs"           name="매출원가 (실적)" stroke="#dc3545" strokeWidth={2} dot={{ r: 4, fill: "#dc3545", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={false} />
                          <Line type="monotone" dataKey="expense"        name="판관비 (실적)"   stroke="#FF8C00" strokeWidth={2} dot={{ r: 4, fill: "#FF8C00", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={false} />
                          <Line type="monotone" dataKey="predictRevenue" name="매출 (예측)"     stroke="#0066cc" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: "#0066cc", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={true} />
                          <Line type="monotone" dataKey="predictCogs"    name="매출원가 (예측)" stroke="#dc3545" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: "#dc3545", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={true} />
                          <Line type="monotone" dataKey="predictExpense" name="판관비 (예측)"   stroke="#FF8C00" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: "#FF8C00", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls={true} />
                        </LineChart>
                      </ResponsiveContainer>
                      </div>
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#0066cc" }} />
                          매출
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#dc3545" }} />
                          매출원가
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: "#FF8C00" }} />
                          판관비
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}

              {chartTab === "pie" && (
                <>
                  <div className="mb-5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">전체 매출 중 계정과목별 비율</p>
                  </div>
                  {pieData.length === 0 ? (
                    <EmptyChartMessage className="py-12">매출 데이터가 없습니다.</EmptyChartMessage>
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
                            label={RenderPieLabel}
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={pieColors[i % pieColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={TooltipFmt} contentStyle={tooltipStyle} />
                          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="w-full shrink-0 space-y-2 sm:w-52">
                        {pieData.map((d, i) => {
                          const total = pieData.reduce((s, p) => s + p.value, 0);
                          const pct   = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0";
                          return (
                            <div key={d.name} className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
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
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{FormatDate(r.created_at)} · {r.row_count}건</p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <p className="text-xs text-slate-400 dark:text-slate-500">영업이익</p>
                  <p className={`text-sm font-semibold ${r.operating_profit < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {FormatKRW(r.operating_profit)}
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
