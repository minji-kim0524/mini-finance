"use client";

import { useMemo } from "react";
import type { FinanceRow, AccountType, PLSummary } from "@/types/finance";
import { CalcPLSummary } from "@/lib/aggregator";
import { FormatKRW } from "@/lib/format";
import { GroupByAccount } from "@/lib/financeAggregation";
import { EmptyState } from "./FinanceTableRows";
import MonthlyChart from "../MonthlyChart";

const summaryLabels: { key: keyof PLSummary; label: string; type?: AccountType; separator?: boolean }[] = [
  { key: "totalRevenue",      label: "총 매출",     type: "revenue" },
  { key: "totalCogs",         label: "매출원가",    type: "cogs" },
  { key: "grossProfit",       label: "매출총이익",  separator: true },
  { key: "totalExpense",      label: "판관비",      type: "expense" },
  { key: "operatingProfit",   label: "영업이익",    separator: true },
  { key: "totalNonOpIncome",  label: "영업외수익",  type: "non_op_income" },
  { key: "totalNonOpExpense", label: "영업외비용",  type: "non_op_expense" },
  { key: "netIncome",         label: "당기순이익",  separator: true },
];

const plTypes: AccountType[] = ["revenue", "cogs", "expense", "non_op_income", "non_op_expense"];

export default function DashboardView({ rows }: { rows: FinanceRow[] }) {
  const plRows = rows.filter(r => plTypes.includes(r.type));
  const summary = plRows.length > 0 ? CalcPLSummary(plRows) : null;

  const breakdown = useMemo(() => {
    const map = new Map<AccountType, Map<string, number>>();
    for (const row of plRows) {
      if (!map.has(row.type)) map.set(row.type, new Map());
      const inner = map.get(row.type)!;
      inner.set(row.account, (inner.get(row.account) ?? 0) + row.amount);
    }
    return map;
  }, [rows]);

  const otherRows = rows.filter(r => r.type === "other");
  const otherBreakdown = useMemo(() => GroupByAccount(otherRows), [rows]);

  return (
    <div className="space-y-4">
      <MonthlyChart rows={plRows} />
      {summary ? (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-800">
              손익 요약{" "}
              <span className="text-sm font-normal text-slate-400">({plRows.length}건)</span>
            </h2>
            <dl className="space-y-2">
              {summaryLabels.map(({ key, label, type, separator }) => (
                <div key={key}>
                  {separator && <div className="my-3 border-t border-slate-100" />}
                  <div className="flex justify-between text-sm">
                    <dt className={type ? "text-slate-500" : "font-medium text-slate-700"}>{label}</dt>
                    <dd className={`font-semibold ${summary[key] < 0 ? "text-red-500" : "text-slate-900"}`}>
                      {FormatKRW(summary[key])}
                    </dd>
                  </div>
                  {type && breakdown.get(type) && (
                    <ul className="mt-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
                      {Array.from(breakdown.get(type)!.entries()).map(([account, amount]) => (
                        <li key={account} className="flex justify-between text-xs">
                          <span className="text-slate-400">{account}</span>
                          <span className="text-slate-400">{FormatKRW(amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </dl>
          </section>
          {otherBreakdown.size > 0 && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-amber-800">미분류 항목</h2>
              <p className="mb-3 text-xs text-amber-600">자동 분류되지 않은 계정과목입니다.</p>
              <ul className="space-y-1">
                {Array.from(otherBreakdown.entries()).map(([account, amount]) => (
                  <li key={account} className="flex justify-between text-sm">
                    <span className="text-amber-700">{account}</span>
                    <span className="font-medium text-amber-800">{FormatKRW(amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}