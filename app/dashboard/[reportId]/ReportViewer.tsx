"use client";

import { useState, useMemo } from "react";
import type { FinanceRow, AccountType, PLSummary } from "@/types/finance";
import { calcPLSummary } from "@/lib/aggregator";
import MonthlyChart from "../MonthlyChart";

type Tab = "dashboard" | "income" | "balance";

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
              <p className="mb-3 text-xs text-amber-600">자동 분류되지 않은 계정과목입니다. 직접 확인이 필요합니다.</p>
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

function IncomeStatementView({ rows }: { rows: FinanceRow[] }) {
  const revenue  = useMemo(() => groupByAccount(rows.filter(r => r.type === "revenue")),  [rows]);
  const cogs     = useMemo(() => groupByAccount(rows.filter(r => r.type === "cogs")),     [rows]);
  const expenses = useMemo(() => groupByAccount(rows.filter(r => r.type === "expense")),  [rows]);

  const totalRevenue  = Array.from(revenue.values()).reduce((s, v) => s + v, 0);
  const totalCogs     = Array.from(cogs.values()).reduce((s, v) => s + v, 0);
  const grossProfit   = totalRevenue - totalCogs;
  const totalExpense  = Array.from(expenses.values()).reduce((s, v) => s + v, 0);
  const operatingProfit = grossProfit - totalExpense;

  if (revenue.size === 0 && cogs.size === 0 && expenses.size === 0) return <EmptyState />;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4 text-center">
        <h2 className="text-base font-semibold text-slate-900">손익계산서</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {/* I. 매출액 */}
        <ISSection
          roman="I."
          label="매출액"
          total={totalRevenue}
          items={revenue}
          isPositive
        />
        {/* II. 매출원가 */}
        <ISSection
          roman="II."
          label="매출원가"
          total={totalCogs}
          items={cogs}
        />
        {/* III. 매출총이익 */}
        <ISSeparator roman="III." label="매출총이익" value={grossProfit} />
        {/* IV. 판매비와관리비 */}
        <ISSection
          roman="IV."
          label="판매비와관리비"
          total={totalExpense}
          items={expenses}
        />
        {/* V. 영업이익 */}
        <ISSeparator roman="V." label="영업이익" value={operatingProfit} highlight />
      </div>
    </div>
  );
}

function ISSection({
  roman, label, total, items, isPositive,
}: {
  roman: string;
  label: string;
  total: number;
  items: Map<string, number>;
  isPositive?: boolean;
}) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">
          <span className="mr-1.5 text-xs text-slate-400">{roman}</span>{label}
        </span>
        <span className={`text-sm font-semibold ${!isPositive && total > 0 ? "text-red-500" : total < 0 ? "text-red-500" : "text-slate-900"}`}>
          {isPositive ? "" : total > 0 ? "(" : ""}{formatKRW(Math.abs(total))}{!isPositive && total > 0 ? ")" : ""}
        </span>
      </div>
      {items.size > 0 && (
        <div className="mt-2 space-y-1 border-l-2 border-slate-100 pl-4">
          {Array.from(items.entries()).map(([account, amount]) => (
            <div key={account} className="flex justify-between text-xs">
              <span className="text-slate-400">{account}</span>
              <span className="text-slate-400">{formatKRW(amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ISSeparator({ roman, label, value, highlight }: { roman: string; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between px-6 py-4 ${highlight ? "bg-slate-50" : ""}`}>
      <span className={`text-sm ${highlight ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
        <span className="mr-1.5 text-xs text-slate-400">{roman}</span>{label}
      </span>
      <span className={`text-sm font-bold ${value < 0 ? "text-red-500" : highlight ? "text-blue-600" : "text-slate-900"}`}>
        {formatKRW(value)}
      </span>
    </div>
  );
}

// ─── 재무상태표 뷰 ───────────────────────────────────────────────

const CURRENT_ASSET_KW = [
  '현금', '보통예금', '당좌예금', '정기예금', '정기적금', '외화예금',
  '매출채권', '받을어음', '외상매출금', '미수금', '미수수익',
  '선급금', '선급비용', '단기대여금',
  '재고자산', '재공품', '저장품',
];
const CURRENT_LIABILITY_KW = [
  '매입채무', '지급어음', '외상매입금',
  '미지급금', '미지급비용', '선수금', '예수금', '부가세예수금',
  '단기차입금', '유동성장기부채',
];

function subClassify(account: string, type: 'asset' | 'liability'): 'current' | 'non_current' {
  const kws = type === 'asset' ? CURRENT_ASSET_KW : CURRENT_LIABILITY_KW;
  return kws.some(kw => account.includes(kw)) ? 'current' : 'non_current';
}

function BalanceSheetView({ rows }: { rows: FinanceRow[] }) {
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

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4 text-center">
        <h2 className="text-base font-semibold text-slate-900">재무상태표</h2>
      </div>

      {/* 자산 */}
      <BSSection title="자산" titleBg="bg-blue-50">
        <BSSubSection label="유동자산" total={totalCurrentAssets} items={currentAssets} />
        <BSSubSection label="비유동자산" total={totalNonCurrentAssets} items={nonCurrentAssets} />
        <BSTotal label="자산 총계" value={totalAssets} />
      </BSSection>

      {/* 부채 */}
      <BSSection title="부채" titleBg="bg-red-50">
        <BSSubSection label="유동부채" total={totalCurrentLiab} items={currentLiab} />
        <BSSubSection label="비유동부채" total={totalNonCurrentLiab} items={nonCurrentLiab} />
        <BSTotal label="부채 총계" value={totalLiabilities} />
      </BSSection>

      {/* 자본 */}
      <BSSection title="자본" titleBg="bg-emerald-50">
        <div className="space-y-1 px-6 py-3">
          {Array.from(equityAccounts.entries()).map(([account, amount]) => (
            <div key={account} className="flex justify-between text-sm">
              <span className="text-slate-600">{account}</span>
              <span className="text-slate-700">{formatKRW(amount)}</span>
            </div>
          ))}
        </div>
        <BSTotal label="자본 총계" value={totalEquity} />
      </BSSection>

      {/* 부채 및 자본 총계 */}
      <div className="flex justify-between rounded-b-3xl bg-slate-900 px-6 py-4">
        <span className="text-sm font-semibold text-white">부채 및 자본 총계</span>
        <span className="text-sm font-bold text-white">{formatKRW(totalLiabAndEquity)}</span>
      </div>
    </div>
  );
}

function BSSection({ title, titleBg, children }: { title: string; titleBg: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div className={`px-6 py-2.5 ${titleBg}`}>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</span>
      </div>
      {children}
    </div>
  );
}

function BSSubSection({ label, total, items }: { label: string; total: number; items: Map<string, number> }) {
  if (items.size === 0) return null;
  return (
    <div className="px-6 py-3">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{formatKRW(total)}</span>
      </div>
      <div className="mt-1.5 space-y-1 border-l-2 border-slate-100 pl-4">
        {Array.from(items.entries()).map(([account, amount]) => (
          <div key={account} className="flex justify-between text-xs">
            <span className="text-slate-400">{account}</span>
            <span className="text-slate-400">{formatKRW(amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BSTotal({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between border-t border-slate-100 px-6 py-3">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <span className={`text-sm font-bold ${value < 0 ? "text-red-500" : "text-slate-900"}`}>{formatKRW(value)}</span>
    </div>
  );
}

function sum(map: Map<string, number>): number {
  return Array.from(map.values()).reduce((s, v) => s + v, 0);
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-500">표시할 데이터가 없습니다.</p>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────

export default function ReportViewer({ rows }: { rows: FinanceRow[] }) {
  const [tab, setTab] = useState<Tab>("dashboard");

  const hasBalanceSheet = useMemo(
    () => rows.some(r => r.type === "asset" || r.type === "liability" || r.type === "equity"),
    [rows]
  );

  const tabs: { value: Tab; label: string; disabled?: boolean }[] = [
    { value: "dashboard", label: "대시보드" },
    { value: "income",    label: "손익계산서" },
    { value: "balance",   label: "재무상태표", disabled: !hasBalanceSheet },
  ];

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex rounded-2xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => !t.disabled && setTab(t.value)}
            disabled={t.disabled}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              tab === t.value
                ? "bg-white text-slate-900 shadow-sm"
                : t.disabled
                ? "cursor-not-allowed text-slate-300"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      {tab === "dashboard" && <DashboardView rows={rows} />}
      {tab === "income"    && <IncomeStatementView rows={rows} />}
      {tab === "balance"   && <BalanceSheetView rows={rows} />}
    </div>
  );
}
