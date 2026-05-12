"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { FinanceRow } from "@/types/finance";
import { groupByMonth, groupByQuarter, groupBySemiAnnual } from "@/lib/aggregator";
import { useTheme } from "@/components/ThemeProvider";

type ChartType = "bar" | "line";
type Period    = "monthly" | "quarterly" | "semiannual";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "monthly",    label: "월별" },
  { value: "quarterly",  label: "분기별" },
  { value: "semiannual", label: "반기별" },
];

const CHART_OPTIONS: { value: ChartType; label: string }[] = [
  { value: "bar",  label: "막대" },
  { value: "line", label: "꺾은선" },
];

const SERIES = [
  { key: "revenue", name: "매출",    color: "#3b82f6" },
  { key: "cogs",    name: "매출원가", color: "#f87171" },
  { key: "expense", name: "판관비",  color: "#fb923c" },
];

export default function MonthlyChart({ rows }: { rows: FinanceRow[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [chartType, setChartType] = useState<ChartType>("bar");
  const [period, setPeriod]       = useState<Period>("monthly");

  const gridColor   = isDark ? "#1e293b" : "#f1f5f9";
  const tickColor   = isDark ? "#64748b" : "#94a3b8";
  const tooltipStyle = isDark
    ? { borderRadius: "12px", border: "1px solid #334155", fontSize: "12px", backgroundColor: "#1e293b", color: "#f1f5f9" }
    : { borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" };

  const data = useMemo(() => {
    if (rows.length === 0) return [];
    if (period === "monthly")    return groupByMonth(rows);
    if (period === "quarterly")  return groupByQuarter(rows);
    return groupBySemiAnnual(rows);
  }, [rows, period]);

  if (data.length === 0) return null;

  const axisTick = { fontSize: 12, fill: tickColor };
  const shared   = { axisLine: false as const, tickLine: false as const };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">손익 추이</h2>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition ${
                  period === opt.value
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
            {CHART_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setChartType(opt.value)}
                className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition ${
                  chartType === opt.value
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {chartType === "bar" ? (
          <BarChart data={data} barCategoryGap="30%" barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} {...shared} />
            <YAxis
              tickFormatter={(v) => `${(v / 10000).toLocaleString("ko-KR")}만`}
              tick={{ fontSize: 11, fill: tickColor }}
              width={56}
              {...shared}
            />
            <Tooltip
              formatter={(value: unknown) =>
                typeof value === "number" ? value.toLocaleString("ko-KR") + "원" : String(value)
              }
              contentStyle={tooltipStyle}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
            {SERIES.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="month" tick={axisTick} {...shared} />
            <YAxis
              tickFormatter={(v) => `${(v / 10000).toLocaleString("ko-KR")}만`}
              tick={{ fontSize: 11, fill: tickColor }}
              width={56}
              {...shared}
            />
            <Tooltip
              formatter={(value: unknown) =>
                typeof value === "number" ? value.toLocaleString("ko-KR") + "원" : String(value)
              }
              contentStyle={tooltipStyle}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
