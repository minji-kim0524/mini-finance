import type { ReactNode } from "react";
import type { FinanceRow } from "@/types/finance";
import { GetDateRange } from "@/lib/financeAggregation";
import { TableHeader } from "./FinanceTableRows";

interface StatementCardProps {
  title: string;
  currentRangeRows: FinanceRow[];
  compareRangeRows?: FinanceRow[] | null;
  hasCompare: boolean;
  children: ReactNode;
}

// 손익계산서/재무상태표/제조원가명세서 뷰가 공통으로 쓰는 카드 레이아웃
export default function StatementCard({ title, currentRangeRows, compareRangeRows, hasCompare, children }: StatementCardProps) {
  const currentRange = GetDateRange(currentRangeRows);
  const compareRange = compareRangeRows ? GetDateRange(compareRangeRows) : null;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-4 py-3.5 text-center">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {currentRange && (
          <p className="mt-1 text-xs text-slate-500">
            당기&nbsp;&nbsp;{currentRange.start} 부터&nbsp;&nbsp;{currentRange.end} 까지
          </p>
        )}
        {compareRange && (
          <p className="mt-0.5 text-xs text-blue-400">
            전기&nbsp;&nbsp;{compareRange.start} 부터&nbsp;&nbsp;{compareRange.end} 까지
          </p>
        )}
        <p className="mt-0.5 text-xs text-slate-400">(단위: 원)</p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px]">
          <TableHeader compare={hasCompare} currentYear={currentRange?.end.slice(0, 4)} compareYear={compareRange?.end.slice(0, 4)} />
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}