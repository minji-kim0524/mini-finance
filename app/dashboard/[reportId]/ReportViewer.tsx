"use client";

import { useState, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import type { FinanceRow, AccountType, PLSummary } from "@/types/finance";
import { calcPLSummary } from "@/lib/aggregator";
import MonthlyChart from "../MonthlyChart";

type Tab = "dashboard" | "income" | "balance";

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

function TableHeader() {
  return (
    <thead>
      <tr className="border-b-2 border-slate-200">
        <th className="py-2.5 pl-5 text-left text-xs font-semibold text-slate-500">계정과목</th>
        <th className="py-2.5 pr-3 text-right text-xs font-semibold text-slate-500">금액</th>
        <th className="py-2.5 pr-5 text-right text-xs font-semibold text-slate-500">합계</th>
      </tr>
    </thead>
  );
}

// 섹션 헤더 행 (I. 매출액 등)
function SectionRow({ roman, label, total, highlight }: { roman: string; label: string; total: number; highlight?: boolean }) {
  return (
    <tr className={highlight ? "border-t-2 border-slate-300 bg-slate-50" : "border-t border-slate-100 bg-slate-50"}>
      <td className={`py-2.5 pl-5 text-sm ${highlight ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
        <span className="mr-1.5 text-xs font-normal text-slate-400">{roman}</span>{label}
      </td>
      <td className="py-2.5 pr-3" />
      <td className={`py-2.5 pr-5 text-right text-sm ${highlight ? "font-bold" : "font-semibold"} ${total < 0 ? "text-red-500" : highlight ? "text-blue-600" : "text-slate-900"}`}>
        {fmtNum(total)}
      </td>
    </tr>
  );
}

// 소계 행 (매출총이익, 영업이익 등)
function SubtotalRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <tr className="border-t-2 border-slate-300 bg-slate-50">
      <td className={`py-2.5 pl-5 text-sm ${bold ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{label}</td>
      <td className="py-2.5 pr-3" />
      <td className={`py-2.5 pr-5 text-right text-sm ${bold ? "font-bold" : "font-semibold"} ${value < 0 ? "text-red-500" : "text-blue-600"}`}>
        {fmtNum(value)}
      </td>
    </tr>
  );
}

// 세부 계정 행 (들여쓰기)
function AccountRow({ account, amount, indent = 1 }: { account: string; amount: number; indent?: number }) {
  return (
    <tr className="border-t border-slate-50 hover:bg-slate-50/60">
      <td className={`py-1.5 text-xs text-slate-500 ${indent === 2 ? "pl-14" : "pl-9"}`}>{account}</td>
      <td className="py-1.5 pr-3 text-right text-xs text-slate-500">{fmtNum(amount)}</td>
      <td className="py-1.5 pr-5" />
    </tr>
  );
}

// 섹션 제목 행 (자산, 부채, 자본)
function CategoryRow({ label }: { label: string }) {
  return (
    <tr className="bg-slate-800">
      <td colSpan={3} className="px-5 py-2 text-xs font-bold tracking-widest text-slate-100">
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

function IncomeStatementView({ rows }: { rows: FinanceRow[] }) {
  const revenue  = useMemo(() => groupByAccount(rows.filter(r => r.type === "revenue")),  [rows]);
  const cogs     = useMemo(() => groupByAccount(rows.filter(r => r.type === "cogs")),     [rows]);
  const expenses = useMemo(() => groupByAccount(rows.filter(r => r.type === "expense")),  [rows]);

  const totalRevenue      = sum(revenue);
  const totalCogs         = sum(cogs);
  const grossProfit       = totalRevenue - totalCogs;
  const totalExpense      = sum(expenses);
  const operatingProfit   = grossProfit - totalExpense;

  if (revenue.size === 0 && cogs.size === 0 && expenses.size === 0) return <EmptyState />;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3.5 text-center">
        <p className="text-base font-semibold text-slate-900">손익계산서</p>
        <p className="mt-0.5 text-xs text-slate-400">(단위: 원)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px]">
          <TableHeader />
          <tbody>
            {/* I. 매출액 */}
            <SectionRow roman="I." label="매출액" total={totalRevenue} />
            {Array.from(revenue.entries()).map(([account, amount]) => (
              <AccountRow key={account} account={account} amount={amount} />
            ))}

            {/* II. 매출원가 */}
            {cogs.size > 0 && (
              <>
                <SectionRow roman="II." label="매출원가" total={totalCogs} />
                {Array.from(cogs.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} />
                ))}
              </>
            )}

            {/* III. 매출총이익 */}
            <SubtotalRow label="III. 매출총이익" value={grossProfit} />

            {/* IV. 판매비와관리비 */}
            {expenses.size > 0 && (
              <>
                <SectionRow roman="IV." label="판매비와관리비" total={totalExpense} />
                {Array.from(expenses.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} />
                ))}
              </>
            )}

            {/* V. 영업이익 */}
            <SubtotalRow label="V. 영업이익" value={operatingProfit} bold />
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
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3.5 text-center">
        <p className="text-base font-semibold text-slate-900">재무상태표</p>
        <p className="mt-0.5 text-xs text-slate-400">(단위: 원)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px]">
          <TableHeader />
          <tbody>
            {/* ── 자산 ── */}
            <CategoryRow label="자  산" />

            {currentAssets.size > 0 && (
              <>
                <SectionRow roman="I." label="유동자산" total={totalCurrentAssets} />
                {Array.from(currentAssets.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} />
                ))}
              </>
            )}

            {nonCurrentAssets.size > 0 && (
              <>
                <SectionRow roman="II." label="비유동자산" total={totalNonCurrentAssets} />
                {Array.from(nonCurrentAssets.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} />
                ))}
              </>
            )}

            <SubtotalRow label="자산 총계" value={totalAssets} bold />

            {/* ── 부채 ── */}
            <CategoryRow label="부  채" />

            {currentLiab.size > 0 && (
              <>
                <SectionRow roman="I." label="유동부채" total={totalCurrentLiab} />
                {Array.from(currentLiab.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} />
                ))}
              </>
            )}

            {nonCurrentLiab.size > 0 && (
              <>
                <SectionRow roman="II." label="비유동부채" total={totalNonCurrentLiab} />
                {Array.from(nonCurrentLiab.entries()).map(([account, amount]) => (
                  <AccountRow key={account} account={account} amount={amount} />
                ))}
              </>
            )}

            <SubtotalRow label="부채 총계" value={totalLiabilities} bold />

            {/* ── 자본 ── */}
            <CategoryRow label="자  본" />

            {Array.from(equityAccounts.entries()).map(([account, amount]) => (
              <AccountRow key={account} account={account} amount={amount} />
            ))}

            <SubtotalRow label="자본 총계" value={totalEquity} bold />

            {/* 부채 및 자본 총계 */}
            <tr className="border-t-2 border-slate-800 bg-slate-900">
              <td className="py-3 pl-5 text-sm font-bold text-white">부채 및 자본 총계</td>
              <td className="py-3 pr-3" />
              <td className="py-3 pr-5 text-right text-sm font-bold text-white">{fmtNum(totalLiabAndEquity)}</td>
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

// ─── 메인 컴포넌트 ───────────────────────────────────────────────

interface ReportViewerProps {
  rows: FinanceRow[];
  reportName: string;
  reportDate: string;
}

export default function ReportViewer({ rows, reportName, reportDate }: ReportViewerProps) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const printRef = useRef<HTMLDivElement>(null);

  const hasBalanceSheet = useMemo(
    () => rows.some(r => r.type === "asset" || r.type === "liability" || r.type === "equity"),
    [rows]
  );

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
  ];

  const isStatementTab = tab === "income" || tab === "balance";

  return (
    <div className="space-y-4">
      {/* 탭 + PDF 버튼 */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-2xl bg-slate-100 p-1">
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

        {isStatementTab && (
          <button
            type="button"
            onClick={() => handlePrint()}
            className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <PrintIcon />
            PDF
          </button>
        )}
      </div>

      {/* 대시보드 탭 */}
      {tab === "dashboard" && <DashboardView rows={rows} />}

      {/* 재무제표 탭 (인쇄 대상) */}
      <div ref={printRef}>
        {tab === "income"  && <IncomeStatementView rows={rows} />}
        {tab === "balance" && <BalanceSheetView rows={rows} />}
      </div>
    </div>
  );
}

function PrintIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
    </svg>
  );
}
