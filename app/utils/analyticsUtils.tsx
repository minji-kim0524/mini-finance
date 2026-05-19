import type { ReactNode } from "react";
// eslint-disable-next-line @typescript-eslint/no-deprecated
import type { PieLabelRenderProps } from "recharts";
import type { Report } from "@/types/finance";
import { formatKRW } from "@/lib/format";

export const PIE_COLORS = ["#3b82f6","#34d399","#f87171","#fb923c","#a78bfa","#f472b6","#facc15","#38bdf8","#4ade80","#f97316"];

export function renderPieLabel(props: PieLabelRenderProps) {
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

export function getChartTheme(isDark: boolean) {
  const tickColor = isDark ? "#64748b" : "#94a3b8";
  return {
    gridColor:    isDark ? "#1e293b" : "#f1f5f9",
    tickColor,
    tooltipStyle: isDark
      ? { borderRadius: "12px", border: "1px solid #334155", fontSize: "12px", backgroundColor: "#1e293b", color: "#f1f5f9" }
      : { borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" },
    axisTick: { fontSize: 11, fill: tickColor },
  };
}

export function buildStats(reports: Report[]) {
  const totalRevenue = reports.reduce((s, r) => s + r.total_revenue, 0);
  const totalOp      = reports.reduce((s, r) => s + r.operating_profit, 0);
  const avgMargin    = totalRevenue > 0 ? (totalOp / totalRevenue) * 100 : 0;
  return [
    { label: "전체 리포트",     value: `${reports.length}개`,      sub: "업로드된 파일" },
    { label: "총 매출",         value: formatKRW(totalRevenue),     sub: "전체 합산" },
    { label: "총 영업이익",     value: formatKRW(totalOp),         sub: "전체 합산",  color: totalOp  >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500" },
    { label: "평균 영업이익률", value: `${avgMargin.toFixed(1)}%`, sub: "전체 평균",  color: avgMargin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500" },
  ];
}

type Tab<T extends string> = { value: T; label: string };

export function TabSwitcher<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly Tab<T>[];
  active: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`rounded-[10px] px-3 py-1.5 text-xs font-medium transition ${
            active === t.value
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyChartMessage({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`flex items-center justify-center text-sm text-slate-400 dark:text-slate-500 ${className ?? "py-16"}`}>
      {children}
    </div>
  );
}
