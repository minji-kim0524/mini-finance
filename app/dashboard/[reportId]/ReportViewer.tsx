"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";
import { useParams } from "next/navigation";
import type { FinanceRow, AccountType, PLSummary } from "@/types/finance";
import { calcPLSummary } from "@/lib/aggregator";
import MonthlyChart from "../MonthlyChart";

type Tab = "dashboard" | "income" | "balance" | "classify";

// 금액 표시: 음수는 괄호, 0은 대시, 원 단위
function fmtNum(n: number): string {
  if (n === 0) return "-";
  const abs = Math.abs(n).toLocaleString("ko-KR");
  return n < 0 ? `(${abs})` : abs;
}

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function groupByAccount(rows: FinanceRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.account, (map.get(row.account) ?? 0) + row.amount);
  }
  return map;
}

function sum(map: Map<string, number>): number {
  return Array.from(map.values()).reduce((s, v) => s + v, 0);
}

// ─── 공통 테이블 행 컴포넌트 ─────────────────────────────────────

function TableHeader({ compare }: { compare?: boolean }) {
  return (
    <thead>
      <tr className="border-b-2 border-slate-200">
        <th className="py-2.5 pl-5 text-left text-xs font-semibold text-slate-500">계정과목</th>
        <th className="py-2.5 pr-3 text-right text-xs font-semibold text-slate-500">금액</th>
        <th className={`py-2.5 text-right text-xs font-semibold text-slate-500 ${compare ? "pr-3" : "pr-5"}`}>
          {compare ? "당기" : "합계"}
        </th>
        {compare && (
          <th className="py-2.5 pr-5 text-right text-xs font-semibold text-blue-400">전기</th>
        )}
      </tr>
    </thead>
  );
}

// 섹션 헤더 행 (I. 매출액 등)
function SectionRow({ roman, label, total, compareTotal, highlight }: { roman: string; label: string; total: number; compareTotal?: number; highlight?: boolean }) {
  const hasCompare = compareTotal !== undefined;
  return (
    <tr className={highlight ? "border-t-2 border-slate-300 bg-slate-50" : "border-t border-slate-100 bg-slate-50"}>
      <td className={`py-2.5 pl-5 text-sm ${highlight ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
        <span className="mr-1.5 text-xs font-normal text-slate-400">{roman}</span>{label}
      </td>
      <td className="py-2.5 pr-3" />
      <td className={`py-2.5 text-right text-sm ${hasCompare ? "pr-3" : "pr-5"} ${highlight ? "font-bold" : "font-semibold"} ${total < 0 ? "text-red-500" : highlight ? "text-blue-600" : "text-slate-900"}`}>
        {fmtNum(total)}
      </td>
      {hasCompare && (
        <td className={`py-2.5 pr-5 text-right text-sm ${highlight ? "font-bold" : "font-semibold"} ${compareTotal < 0 ? "text-red-300" : "text-blue-300"}`}>
          {fmtNum(compareTotal)}
        </td>
      )}
    </tr>
  );
}

// 소계 행 (매출총이익, 영업이익 등)
function SubtotalRow({ label, value, compareValue, bold }: { label: string; value: number; compareValue?: number; bold?: boolean }) {
  const hasCompare = compareValue !== undefined;
  return (
    <tr className="border-t-2 border-slate-300 bg-slate-50">
      <td className={`py-2.5 pl-5 text-sm ${bold ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{label}</td>
      <td className="py-2.5 pr-3" />
      <td className={`py-2.5 text-right text-sm ${hasCompare ? "pr-3" : "pr-5"} ${bold ? "font-bold" : "font-semibold"} ${value < 0 ? "text-red-500" : "text-blue-600"}`}>
        {fmtNum(value)}
      </td>
      {hasCompare && (
        <td className={`py-2.5 pr-5 text-right text-sm ${bold ? "font-bold" : "font-semibold"} ${compareValue < 0 ? "text-red-300" : "text-blue-300"}`}>
          {fmtNum(compareValue)}
        </td>
      )}
    </tr>
  );
}

// 세부 계정 행 (들여쓰기)
function AccountRow({ account, amount, compareAmount, indent = 1 }: { account: string; amount: number; compareAmount?: number; indent?: number }) {
  const hasCompare = compareAmount !== undefined;
  return (
    <tr className="border-t border-slate-50 hover:bg-slate-50/60">
      <td className={`py-1.5 text-xs text-slate-500 ${indent === 2 ? "pl-14" : "pl-9"}`}>{account}</td>
      <td className={`py-1.5 text-right text-xs text-slate-500 ${hasCompare ? "pr-3" : "pr-3"}`}>{fmtNum(amount)}</td>
      <td className={`py-1.5 ${hasCompare ? "pr-3" : "pr-5"}`} />
      {hasCompare && (
        <td className="py-1.5 pr-5 text-right text-xs text-blue-300">{fmtNum(compareAmount)}</td>
      )}
    </tr>
  );
}

// 섹션 제목 행 (자산, 부채, 자본)
function CategoryRow({ label, colSpan = 3 }: { label: string; colSpan?: number }) {
  return (
    <tr className="bg-slate-800">
      <td colSpan={colSpan} className="px-5 py-2 text-xs font-bold tracking-widest text-slate-100">
        {label}
      </td>
    </tr>
  );
}

// ─── 대시보드 뷰 ────────────────────────────────────────────────

const SUMMARY_LABELS: { key: keyof PLSummary; label: string; type?: AccountType; separator?: boolean }[] = [
  { key: "totalRevenue",    label: "총 매출",    type: "revenue" },
  { key: "totalCogs",       label: "매출원가",   type: "cogs" },
  { key: "grossProfit",     label: "매출총이익", separator: true },
  { key: "totalExpense",    label: "판관비",     type: "expense" },
  { key: "operatingProfit", label: "영업이익",   separator: true },
];

function DashboardView({ rows }: { rows: FinanceRow[] }) {
  const plRows = rows.filter(r => r.type === "revenue" || r.type === "cogs" || r.type === "expense");
  const summary = plRows.length > 0 ? calcPLSummary(plRows) : null;

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
  const otherBreakdown = useMemo(() => groupByAccount(otherRows), [rows]);

  return (
    <div className="space-y-4">
      <MonthlyChart rows={plRows} />
      {summary ? (
        <>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-800">
              손익 요약{" "}
              <span className="text-sm font-normal text-slate-400">({plRows.length}건)</span>
            </h2>
            <dl className="space-y-2">
              {SUMMARY_LABELS.map(({ key, label, type, separator }) => (
                <div key={key}>
                  {separator && <div className="my-3 border-t border-slate-100" />}
                  <div className="flex justify-between text-sm">
                    <dt className={type ? "text-slate-500" : "font-medium text-slate-700"}>{label}</dt>
                    <dd className={`font-semibold ${summary[key] < 0 ? "text-red-500" : "text-slate-900"}`}>
                      {formatKRW(summary[key])}
                    </dd>
                  </div>
                  {type && breakdown.get(type) && (
                    <div className="mt-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
                      {Array.from(breakdown.get(type)!.entries()).map(([account, amount]) => (
                        <div key={account} className="flex justify-between text-xs">
                          <span className="text-slate-400">{account}</span>
                          <span className="text-slate-400">{formatKRW(amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </dl>
          </div>
          {otherBreakdown.size > 0 && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-amber-800">미분류 항목</h2>
              <p className="mb-3 text-xs text-amber-600">자동 분류되지 않은 계정과목입니다.</p>
              <div className="space-y-1">
                {Array.from(otherBreakdown.entries()).map(([account, amount]) => (
                  <div key={account} className="flex justify-between text-sm">
                    <span className="text-amber-700">{account}</span>
                    <span className="font-medium text-amber-800">{formatKRW(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

// ─── 손익계산서 뷰 ───────────────────────────────────────────────

function IncomeStatementView({ rows, compareRows }: { rows: FinanceRow[]; compareRows?: FinanceRow[] }) {
  const revenue  = useMemo(() => groupByAccount(rows.filter(r => r.type === "revenue")),  [rows]);
  const cogs     = useMemo(() => groupByAccount(rows.filter(r => r.type === "cogs")),     [rows]);
  const expenses = useMemo(() => groupByAccount(rows.filter(r => r.type === "expense")),  [rows]);

  const cRevenue  = useMemo(() => compareRows ? groupByAccount(compareRows.filter(r => r.type === "revenue"))  : null, [compareRows]);
  const cCogs     = useMemo(() => compareRows ? groupByAccount(compareRows.filter(r => r.type === "cogs"))     : null, [compareRows]);
  const cExpenses = useMemo(() => compareRows ? groupByAccount(compareRows.filter(r => r.type === "expense"))  : null, [compareRows]);

  const totalRevenue      = sum(revenue);
  const totalCogs         = sum(cogs);
  const grossProfit       = totalRevenue - totalCogs;
  const totalExpense      = sum(expenses);
  const operatingProfit   = grossProfit - totalExpense;

  const cTotalRevenue    = cRevenue  ? sum(cRevenue)  : undefined;
  const cTotalCogs       = cCogs     ? sum(cCogs)     : undefined;
  const cGrossProfit     = cTotalRevenue !== undefined && cTotalCogs !== undefined ? cTotalRevenue - cTotalCogs : undefined;
  const cTotalExpense    = cExpenses  ? sum(cExpenses)  : undefined;
  const cOperatingProfit = cGrossProfit !== undefined && cTotalExpense !== undefined ? cGrossProfit - cTotalExpense : undefined;

  const compare = !!compareRows;
  const colSpan = compare ? 4 : 3;

  // 전기 계정별 금액 조회 헬퍼
  function cAmt(map: Map<string, number> | null, account: string): number | undefined {
    return map ? (map.get(account) ?? 0) : undefined;
  }

  if (revenue.size === 0 && cogs.size === 0 && expenses.size === 0) return <EmptyState />;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3.5 text-center">
        <p className="text-base font-semibold text-slate-900">손익계산서</p>
        <p className="mt-0.5 text-xs text-slate-400">(단위: 원)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px]">
          <TableHeader compare={compare} />
          <tbody>
            {/* I. 매출액 */}
            <SectionRow roman="I." label="매출액" total={totalRevenue} compareTotal={cTotalRevenue} />
            {Array.from(revenue.entries()).map(([account, amount]) => (
              <AccountRow key={account} account={account} amount={amount} compareAmount={cAmt(cRevenue, account)} />
            ))}

            {/* II. 매출원가 */}
            {(cogs.size > 0 || (cCogs && cCogs.size > 0)) && (
              <>
                <SectionRow roman="II." label="매출원가" total={totalCogs} compareTotal={cTotalCogs} />
                {Array.from(cogs.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} compareAmount={cAmt(cCogs, account)} />
                ))}
              </>
            )}

            {/* III. 매출총이익 */}
            <SubtotalRow label="III. 매출총이익" value={grossProfit} compareValue={cGrossProfit} />

            {/* IV. 판매비와관리비 */}
            {(expenses.size > 0 || (cExpenses && cExpenses.size > 0)) && (
              <>
                <SectionRow roman="IV." label="판매비와관리비" total={totalExpense} compareTotal={cTotalExpense} />
                {Array.from(expenses.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} compareAmount={cAmt(cExpenses, account)} />
                ))}
              </>
            )}

            {/* V. 영업이익 */}
            <SubtotalRow label="V. 영업이익" value={operatingProfit} compareValue={cOperatingProfit} bold />
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 재무상태표 뷰 ───────────────────────────────────────────────

const CURRENT_ASSET_KW     = ['현금','보통예금','당좌예금','정기예금','정기적금','외화예금','매출채권','받을어음','외상매출금','미수금','미수수익','선급금','선급비용','단기대여금','재고자산','재공품','저장품'];
const CURRENT_LIABILITY_KW = ['매입채무','지급어음','외상매입금','미지급금','미지급비용','선수금','예수금','부가세예수금','단기차입금','유동성장기부채'];

function subClassify(account: string, type: 'asset' | 'liability'): 'current' | 'non_current' {
  const kws = type === 'asset' ? CURRENT_ASSET_KW : CURRENT_LIABILITY_KW;
  return kws.some(kw => account.includes(kw)) ? 'current' : 'non_current';
}

function BalanceSheetView({ rows, compareRows }: { rows: FinanceRow[]; compareRows?: FinanceRow[] }) {
  const assets      = rows.filter(r => r.type === "asset");
  const liabilities = rows.filter(r => r.type === "liability");
  const equity      = rows.filter(r => r.type === "equity");

  if (assets.length === 0 && liabilities.length === 0 && equity.length === 0) return <EmptyState />;

  const currentAssets    = groupByAccount(assets.filter(r => subClassify(r.account, 'asset') === 'current'));
  const nonCurrentAssets = groupByAccount(assets.filter(r => subClassify(r.account, 'asset') === 'non_current'));
  const currentLiab      = groupByAccount(liabilities.filter(r => subClassify(r.account, 'liability') === 'current'));
  const nonCurrentLiab   = groupByAccount(liabilities.filter(r => subClassify(r.account, 'liability') === 'non_current'));
  const equityAccounts   = groupByAccount(equity);

  const totalCurrentAssets    = sum(currentAssets);
  const totalNonCurrentAssets = sum(nonCurrentAssets);
  const totalAssets           = totalCurrentAssets + totalNonCurrentAssets;
  const totalCurrentLiab      = sum(currentLiab);
  const totalNonCurrentLiab   = sum(nonCurrentLiab);
  const totalLiabilities      = totalCurrentLiab + totalNonCurrentLiab;
  const totalEquity           = sum(equityAccounts);
  const totalLiabAndEquity    = totalLiabilities + totalEquity;

  // 전기 데이터
  const cAssets      = compareRows ? compareRows.filter(r => r.type === "asset")      : null;
  const cLiabilities = compareRows ? compareRows.filter(r => r.type === "liability")  : null;
  const cEquity      = compareRows ? compareRows.filter(r => r.type === "equity")     : null;

  const cCurrentAssets    = cAssets      ? groupByAccount(cAssets.filter(r => subClassify(r.account, 'asset') === 'current'))          : null;
  const cNonCurrentAssets = cAssets      ? groupByAccount(cAssets.filter(r => subClassify(r.account, 'asset') === 'non_current'))      : null;
  const cCurrentLiab      = cLiabilities ? groupByAccount(cLiabilities.filter(r => subClassify(r.account, 'liability') === 'current')) : null;
  const cNonCurrentLiab   = cLiabilities ? groupByAccount(cLiabilities.filter(r => subClassify(r.account, 'liability') === 'non_current')) : null;
  const cEquityAccounts   = cEquity      ? groupByAccount(cEquity)                                                                      : null;

  const cTotalCurrentAssets    = cCurrentAssets    ? sum(cCurrentAssets)    : undefined;
  const cTotalNonCurrentAssets = cNonCurrentAssets ? sum(cNonCurrentAssets) : undefined;
  const cTotalAssets           = cTotalCurrentAssets !== undefined && cTotalNonCurrentAssets !== undefined ? cTotalCurrentAssets + cTotalNonCurrentAssets : undefined;
  const cTotalCurrentLiab      = cCurrentLiab      ? sum(cCurrentLiab)      : undefined;
  const cTotalNonCurrentLiab   = cNonCurrentLiab   ? sum(cNonCurrentLiab)   : undefined;
  const cTotalLiabilities      = cTotalCurrentLiab !== undefined && cTotalNonCurrentLiab !== undefined ? cTotalCurrentLiab + cTotalNonCurrentLiab : undefined;
  const cTotalEquity           = cEquityAccounts   ? sum(cEquityAccounts)   : undefined;
  const cTotalLiabAndEquity    = cTotalLiabilities !== undefined && cTotalEquity !== undefined ? cTotalLiabilities + cTotalEquity : undefined;

  const compare = !!compareRows;
  const colSpan = compare ? 4 : 3;

  function cAmt(map: Map<string, number> | null, account: string): number | undefined {
    return map ? (map.get(account) ?? 0) : undefined;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3.5 text-center">
        <p className="text-base font-semibold text-slate-900">재무상태표</p>
        <p className="mt-0.5 text-xs text-slate-400">(단위: 원)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px]">
          <TableHeader compare={compare} />
          <tbody>
            {/* ── 자산 ── */}
            <CategoryRow label="자  산" colSpan={colSpan} />

            {currentAssets.size > 0 && (
              <>
                <SectionRow roman="I." label="유동자산" total={totalCurrentAssets} compareTotal={cTotalCurrentAssets} />
                {Array.from(currentAssets.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} compareAmount={cAmt(cCurrentAssets, account)} />
                ))}
              </>
            )}

            {nonCurrentAssets.size > 0 && (
              <>
                <SectionRow roman="II." label="비유동자산" total={totalNonCurrentAssets} compareTotal={cTotalNonCurrentAssets} />
                {Array.from(nonCurrentAssets.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} compareAmount={cAmt(cNonCurrentAssets, account)} />
                ))}
              </>
            )}

            <SubtotalRow label="자산 총계" value={totalAssets} compareValue={cTotalAssets} bold />

            {/* ── 부채 ── */}
            <CategoryRow label="부  채" colSpan={colSpan} />

            {currentLiab.size > 0 && (
              <>
                <SectionRow roman="I." label="유동부채" total={totalCurrentLiab} compareTotal={cTotalCurrentLiab} />
                {Array.from(currentLiab.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} compareAmount={cAmt(cCurrentLiab, account)} />
                ))}
              </>
            )}

            {nonCurrentLiab.size > 0 && (
              <>
                <SectionRow roman="II." label="비유동부채" total={totalNonCurrentLiab} compareTotal={cTotalNonCurrentLiab} />
                {Array.from(nonCurrentLiab.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} compareAmount={cAmt(cNonCurrentLiab, account)} />
                ))}
              </>
            )}

            <SubtotalRow label="부채 총계" value={totalLiabilities} compareValue={cTotalLiabilities} bold />

            {/* ── 자본 ── */}
            <CategoryRow label="자  본" colSpan={colSpan} />

            {Array.from(equityAccounts.entries()).map(([account, amount]) => (
              <AccountRow key={account} account={account} amount={amount} compareAmount={cAmt(cEquityAccounts, account)} />
            ))}

            <SubtotalRow label="자본 총계" value={totalEquity} compareValue={cTotalEquity} bold />

            {/* 부채 및 자본 총계 */}
            <tr className="border-t-2 border-slate-800 bg-slate-900">
              <td className="py-3 pl-5 text-sm font-bold text-white">부채 및 자본 총계</td>
              <td className="py-3 pr-3" />
              <td className={`py-3 text-right text-sm font-bold text-white ${compare ? "pr-3" : "pr-5"}`}>{fmtNum(totalLiabAndEquity)}</td>
              {compare && (
                <td className="py-3 pr-5 text-right text-sm font-bold text-blue-300">{cTotalLiabAndEquity !== undefined ? fmtNum(cTotalLiabAndEquity) : "-"}</td>
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 공통 ────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-500">표시할 데이터가 없습니다.</p>
    </div>
  );
}

// ─── 계정 분류 뷰 ────────────────────────────────────────────────

const TYPE_LABELS: Record<AccountType, string> = {
  revenue:   "매출",
  cogs:      "매출원가",
  expense:   "판관비",
  asset:     "자산",
  liability: "부채",
  equity:    "자본",
  other:     "미분류",
};

const TYPE_COLORS: Record<AccountType, string> = {
  revenue:   "bg-blue-100 text-blue-700",
  cogs:      "bg-orange-100 text-orange-700",
  expense:   "bg-purple-100 text-purple-700",
  asset:     "bg-emerald-100 text-emerald-700",
  liability: "bg-rose-100 text-rose-700",
  equity:    "bg-teal-100 text-teal-700",
  other:     "bg-amber-100 text-amber-800",
};

const ALL_TYPES: AccountType[] = ["revenue", "cogs", "expense", "asset", "liability", "equity", "other"];

function ClassifyView({
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

  async function handleChange(account: string, newType: AccountType) {
    setPending(account);
    setErrorMsg(null);
    try {
      await onReclassify(account, newType);
    } catch (e) {
      setErrorMsg(`저장 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPending(null);
    }
  }

  const otherCount = accounts.filter(([, v]) => v.type === "other").length;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-base font-semibold text-slate-900">계정 분류 수정</p>
        <p className="mt-0.5 text-xs text-slate-400">
          자동 분류가 잘못된 항목을 직접 수정할 수 있습니다.
          {otherCount > 0 && (
            <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              미분류 {otherCount}건
            </span>
          )}
        </p>
      </div>
      {errorMsg && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-2.5 text-xs text-red-600">
          {errorMsg}
        </div>
      )}
      <div className="divide-y divide-slate-50">
        {accounts.map(([account, { type, total }]) => (
          <div
            key={account}
            className={`flex items-center gap-3 px-5 py-3 transition ${type === "other" ? "bg-amber-50/60" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{account}</p>
              <p className="mt-0.5 text-xs text-slate-400">{fmtNum(total)}원</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[type]}`}>
                {TYPE_LABELS[type]}
              </span>
              <select
                value={type}
                disabled={pending === account}
                onChange={(e) => handleChange(account, e.target.value as AccountType)}
                className="rounded-xl border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-slate-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
              {pending === account && (
                <svg className="h-4 w-4 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Excel 내보내기 ──────────────────────────────────────────────

type Row = (string | number | null)[];

function makeSheet(data: Row[], colWidths: number[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = colWidths.map(wch => ({ wch }));
  return ws;
}

function exportIncomeStatement(rows: FinanceRow[], filename: string) {
  const revenue  = groupByAccount(rows.filter(r => r.type === "revenue"));
  const cogs     = groupByAccount(rows.filter(r => r.type === "cogs"));
  const expenses = groupByAccount(rows.filter(r => r.type === "expense"));

  const totalRevenue      = sum(revenue);
  const totalCogs         = sum(cogs);
  const grossProfit       = totalRevenue - totalCogs;
  const totalExpense      = sum(expenses);
  const operatingProfit   = grossProfit - totalExpense;

  const data: Row[] = [
    ['계정과목', '금액', '합계'],
    ['I. 매출액', null, totalRevenue],
    ...Array.from(revenue.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ...(cogs.size > 0 ? [
      ['II. 매출원가', null, totalCogs] as Row,
      ...Array.from(cogs.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ['III. 매출총이익', null, grossProfit],
    ...(expenses.size > 0 ? [
      ['IV. 판매비와관리비', null, totalExpense] as Row,
      ...Array.from(expenses.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ['V. 영업이익', null, operatingProfit],
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet(data, [32, 18, 18]), '손익계산서');
  XLSX.writeFile(wb, `${filename}_손익계산서.xlsx`);
}

function exportBalanceSheet(rows: FinanceRow[], filename: string) {
  const assets      = rows.filter(r => r.type === "asset");
  const liabilities = rows.filter(r => r.type === "liability");
  const equity      = rows.filter(r => r.type === "equity");

  const currentAssets    = groupByAccount(assets.filter(r => CURRENT_ASSET_KW.some(kw => r.account.includes(kw))));
  const nonCurrentAssets = groupByAccount(assets.filter(r => !CURRENT_ASSET_KW.some(kw => r.account.includes(kw))));
  const currentLiab      = groupByAccount(liabilities.filter(r => CURRENT_LIABILITY_KW.some(kw => r.account.includes(kw))));
  const nonCurrentLiab   = groupByAccount(liabilities.filter(r => !CURRENT_LIABILITY_KW.some(kw => r.account.includes(kw))));
  const equityAccounts   = groupByAccount(equity);

  const totalCurrentAssets    = sum(currentAssets);
  const totalNonCurrentAssets = sum(nonCurrentAssets);
  const totalAssets           = totalCurrentAssets + totalNonCurrentAssets;
  const totalCurrentLiab      = sum(currentLiab);
  const totalNonCurrentLiab   = sum(nonCurrentLiab);
  const totalLiabilities      = totalCurrentLiab + totalNonCurrentLiab;
  const totalEquity           = sum(equityAccounts);

  const data: Row[] = [
    ['계정과목', '금액', '합계'],
    ['【자산】', null, null],
    ...(currentAssets.size > 0 ? [
      ['I. 유동자산', null, totalCurrentAssets] as Row,
      ...Array.from(currentAssets.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ...(nonCurrentAssets.size > 0 ? [
      ['II. 비유동자산', null, totalNonCurrentAssets] as Row,
      ...Array.from(nonCurrentAssets.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ['자산 총계', null, totalAssets],
    [null, null, null],
    ['【부채】', null, null],
    ...(currentLiab.size > 0 ? [
      ['I. 유동부채', null, totalCurrentLiab] as Row,
      ...Array.from(currentLiab.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ...(nonCurrentLiab.size > 0 ? [
      ['II. 비유동부채', null, totalNonCurrentLiab] as Row,
      ...Array.from(nonCurrentLiab.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ['부채 총계', null, totalLiabilities],
    [null, null, null],
    ['【자본】', null, null],
    ...Array.from(equityAccounts.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ['자본 총계', null, totalEquity],
    [null, null, null],
    ['부채 및 자본 총계', null, totalLiabilities + totalEquity],
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeSheet(data, [32, 18, 18]), '재무상태표');
  XLSX.writeFile(wb, `${filename}_재무상태표.xlsx`);
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────

interface ReportViewerProps {
  rows: FinanceRow[];
  reportName: string;
  otherReports?: { id: string; name: string; created_at: string }[];
}

export default function ReportViewer({ rows: initialRows, reportName, otherReports = [] }: ReportViewerProps) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [rows, setRows] = useState<FinanceRow[]>(initialRows);
  const [compareId, setCompareId] = useState<string>("");
  const [compareRows, setCompareRows] = useState<FinanceRow[] | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const params = useParams<{ reportId: string }>();

  const hasBalanceSheet = useMemo(
    () => rows.some(r => r.type === "asset" || r.type === "liability" || r.type === "equity"),
    [rows]
  );

  const handleReclassify = useCallback(async (account: string, newType: AccountType) => {
    // 낙관적 업데이트: 즉시 UI 반영
    let prevType: AccountType | null = null;
    setRows(prev => {
      const found = prev.find(r => r.account === account);
      if (found) prevType = found.type;
      return prev.map(r => r.account === account ? { ...r, type: newType } : r);
    });

    const res = await fetch(`/api/reports/${params.reportId}/reclassify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, type: newType }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      // 실패 시 롤백
      if (prevType !== null) {
        setRows(prev => prev.map(r => r.account === account ? { ...r, type: prevType! } : r));
      }
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
  }, [params.reportId]);

  const handleCompareChange = useCallback(async (id: string) => {
    setCompareId(id);
    if (!id) { setCompareRows(null); return; }
    setCompareLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}/rows`);
      const json = await res.json() as { rows: FinanceRow[] };
      setCompareRows(json.rows);
    } finally {
      setCompareLoading(false);
    }
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: reportName,
    pageStyle: `
      @page { size: A4 portrait; margin: 20mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  const tabs: { value: Tab; label: string; disabled?: boolean }[] = [
    { value: "dashboard", label: "대시보드" },
    { value: "income",    label: "손익계산서" },
    { value: "balance",   label: "재무상태표", disabled: !hasBalanceSheet },
    { value: "classify",  label: "계정 분류" },
  ];

  const isStatementTab = tab === "income" || tab === "balance";
  const otherCount = useMemo(() => {
    const seen = new Set<string>();
    return rows.filter(r => { if (r.type === "other" && !seen.has(r.account)) { seen.add(r.account); return true; } return false; }).length;
  }, [rows]);

  function handleExcelExport() {
    const name = reportName.replace(/\.(xlsx|xls)$/i, "");
    if (tab === "income")  exportIncomeStatement(rows, name);
    if (tab === "balance") exportBalanceSheet(rows, name);
  }

  return (
    <div className="space-y-4">
      {/* 탭 + 내보내기 버튼 */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-2xl bg-slate-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => !t.disabled && setTab(t.value)}
              disabled={t.disabled}
              className={`relative flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === t.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : t.disabled
                  ? "cursor-not-allowed text-slate-300"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              {t.value === "classify" && otherCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
                  {otherCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {isStatementTab && (
          <>
            <button
              type="button"
              onClick={() => handlePrint()}
              className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              <PrintIcon />
              PDF
            </button>
            <button
              type="button"
              onClick={handleExcelExport}
              className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
            >
              <ExcelIcon />
              Excel
            </button>
          </>
        )}
      </div>

      {/* 전기 비교 선택 */}
      {isStatementTab && otherReports.length > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-2.5">
          <span className="shrink-0 text-xs font-semibold text-blue-600">전기 비교</span>
          <select
            value={compareId}
            onChange={(e) => handleCompareChange(e.target.value)}
            disabled={compareLoading}
            className="min-w-0 flex-1 rounded-xl border border-blue-200 bg-white py-1.5 pl-3 pr-7 text-xs text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
          >
            <option value="">비교 안 함</option>
            {otherReports.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {compareLoading && (
            <svg className="h-4 w-4 shrink-0 animate-spin text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>
      )}

      {/* 대시보드 탭 */}
      {tab === "dashboard" && <DashboardView rows={rows} />}

      {/* 재무제표 탭 (인쇄 대상) */}
      <div ref={printRef}>
        {tab === "income"  && <IncomeStatementView rows={rows} compareRows={compareRows ?? undefined} />}
        {tab === "balance" && <BalanceSheetView rows={rows} compareRows={compareRows ?? undefined} />}
      </div>

      {/* 계정 분류 탭 */}
      {tab === "classify" && <ClassifyView rows={rows} onReclassify={handleReclassify} />}
    </div>
  );
}

function ExcelIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
    </svg>
  );
}
