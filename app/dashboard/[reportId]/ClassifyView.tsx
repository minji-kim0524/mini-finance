"use client";

import { useState, useMemo } from "react";
import type { FinanceRow, AccountType } from "@/types/finance";
import { FmtNum } from "@/lib/financeAggregation";
import { typeLabels, typeColors, allTypes } from "@/lib/financeClassify";

export default function ClassifyView({
  rows,
  onReclassify,
}: {
  rows: FinanceRow[];
  onReclassify: (account: string, type: AccountType) => Promise<void>;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 계정과목 단위로 집계 (같은 계정은 하나로)
  const accounts = useMemo(() => {
    const map = new Map<string, { type: AccountType; total: number }>();
    for (const row of rows) {
      const existing = map.get(row.account);
      if (existing) {
        existing.total += row.amount;
      } else {
        map.set(row.account, { type: row.type, total: row.amount });
      }
    }
    // other 먼저, 나머지는 type 순
    return Array.from(map.entries()).sort((a, b) => {
      if (a[1].type === "other" && b[1].type !== "other") return -1;
      if (a[1].type !== "other" && b[1].type === "other") return 1;
      return a[1].type.localeCompare(b[1].type);
    });
  }, [rows]);

  async function HandleChange(account: string, newType: AccountType) {
    setPending(account);
    setErrorMsg(null);
    try {
      await onReclassify(account, newType);
    } catch {
      setErrorMsg("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(null);
    }
  }

  const otherCount = accounts.filter(([, v]) => v.type === "other").length;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-5 py-4">
        <p className="text-base font-semibold text-slate-900">계정 분류 수정</p>
        <p className="mt-0.5 text-xs text-slate-400">
          자동 분류가 잘못된 항목을 직접 수정할 수 있습니다.
          {otherCount > 0 && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              미분류 {otherCount}건
            </span>
          )}
        </p>
      </header>
      {errorMsg && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-2.5 text-xs text-red-600">
          {errorMsg}
        </div>
      )}
      <ul className="divide-y divide-slate-50">
        {accounts.map(([account, { type, total }]) => (
          <li
            key={account}
            className={`flex items-center gap-3 px-5 py-3 transition ${type === "other" ? "bg-amber-50/60" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{account}</p>
              <p className="mt-0.5 text-xs text-slate-400">{FmtNum(total)}원</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[type]}`}>
                {typeLabels[type]}
              </span>
              <select
                value={type}
                disabled={pending === account}
                onChange={(e) => HandleChange(account, e.target.value as AccountType)}
                className="rounded-xl border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-slate-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              >
                {allTypes.map((t) => (
                  <option key={t} value={t}>{typeLabels[t]}</option>
                ))}
              </select>
              {pending === account && (
                <svg className="h-4 w-4 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}