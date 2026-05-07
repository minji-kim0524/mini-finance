"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { FinanceRow } from "@/types/finance";
import { groupByMonth, groupByQuarter, groupBySemiAnnual } from "@/lib/aggregator";

type ChartType = "bar" | "line";
type Period = "monthly" | "quarterly" | "semiannual";

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

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  fontSize: "12px",
};

const AXIS_TICK = { fontSize: 12, fill: "#94a3b8" };

function tooltipFormatter(value: unknown) {
  return typeof value === "number" ? value.toLocaleString("ko-KR") + "원" : String(value);
}

export default function MonthlyChart({ rows }: { rows: FinanceRow[] }) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [period, setPeriod]       = useState<Period>("monthly");

  const data = useMemo(() => {
    if (rows.length === 0) return [];
    if (period === "monthly")    return groupByMonth(rows);
    if (period === "quarterly")  return groupByQuarter(rows);
    return groupBySemiAnnual(rows);
  }, [rows, period]);

  if (data.length === 0) return null;

  const sharedAxisProps = {
    axisLine: false,
    tickLine: false,
  } as const;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800">손익 추이</h2>

        <div className="flex items-center gap-2">
          {/* 기간 토글 */}
          <div className="flex rounded-xl bg-slate-100 p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition ${
                  period === opt.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 차트 유형 토글 */}
          <div className="flex rounded-xl bg-slate-100 p-0.5">
            {CHART_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setChartType(opt.value)}
                className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition ${
                  chartType === opt.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
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
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} {...sharedAxisProps} />
            <YAxis
              tickFormatter={(v) => `${(v / 10000).toLocaleString("ko-KR")}만`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              width={56}
              {...sharedAxisProps}
            />
            <Tooltip formatter={tooltipFormatter} contentStyle={TOOLTIP_STYLE} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
            {SERIES.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} {...sharedAxisProps} />
            <YAxis
              tickFormatter={(v) => `${(v / 10000).toLocaleString("ko-KR")}만`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              width={56}
              {...sharedAxisProps}
            />
            <Tooltip formatter={tooltipFormatter} contentStyle={TOOLTIP_STYLE} />
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
