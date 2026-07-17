import type { FinanceRow } from "@/types/finance";
import { GroupByAccount, Sum } from "@/lib/financeAggregation";
import { SubClassify, SubClassifyMfgCost } from "@/lib/financeClassify";

type Row = (string | number | null)[];
type XLSXModule = typeof import("xlsx");

function MakeSheet(XLSX: XLSXModule, data: Row[], colWidths: number[]) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = colWidths.map(wch => ({ wch }));
  return ws;
}

export async function ExportIncomeStatement(rows: FinanceRow[], filename: string) {
  const XLSX = await import("xlsx");
  const revenue  = GroupByAccount(rows.filter(r => r.type === "revenue"));
  const cogs     = GroupByAccount(rows.filter(r => r.type === "cogs"));
  const expenses = GroupByAccount(rows.filter(r => r.type === "expense"));
  const nonOpInc = GroupByAccount(rows.filter(r => r.type === "non_op_income"));
  const nonOpExp = GroupByAccount(rows.filter(r => r.type === "non_op_expense"));

  const totalRevenue    = Sum(revenue);
  const totalCogs       = Sum(cogs);
  const grossProfit     = totalRevenue - totalCogs;
  const totalExpense    = Sum(expenses);
  const operatingProfit = grossProfit - totalExpense;
  const totalNonOpInc   = Sum(nonOpInc);
  const totalNonOpExp   = Sum(nonOpExp);
  const netIncome       = operatingProfit + totalNonOpInc - totalNonOpExp;
  const hasNonOp        = nonOpInc.size > 0 || nonOpExp.size > 0;

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
    ...(nonOpInc.size > 0 ? [
      ['VI. 영업외수익', null, totalNonOpInc] as Row,
      ...Array.from(nonOpInc.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ...(nonOpExp.size > 0 ? [
      ['VII. 영업외비용', null, totalNonOpExp] as Row,
      ...Array.from(nonOpExp.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ...(hasNonOp ? [['VIII. 당기순이익', null, netIncome] as Row] : []),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, MakeSheet(XLSX, data, [32, 18, 18]), '손익계산서');
  XLSX.writeFile(wb, `${filename}_손익계산서.xlsx`);
}

export async function ExportBalanceSheet(rows: FinanceRow[], filename: string) {
  const XLSX = await import("xlsx");
  const assets      = rows.filter(r => r.type === "asset");
  const liabilities = rows.filter(r => r.type === "liability");
  const equity      = rows.filter(r => r.type === "equity");

  const currentAssets    = GroupByAccount(assets.filter(r => SubClassify(r.account, 'asset') === 'current'));
  const nonCurrentAssets = GroupByAccount(assets.filter(r => SubClassify(r.account, 'asset') === 'non_current'));
  const currentLiab      = GroupByAccount(liabilities.filter(r => SubClassify(r.account, 'liability') === 'current'));
  const nonCurrentLiab   = GroupByAccount(liabilities.filter(r => SubClassify(r.account, 'liability') === 'non_current'));
  const equityAccounts   = GroupByAccount(equity);

  const totalCurrentAssets    = Sum(currentAssets);
  const totalNonCurrentAssets = Sum(nonCurrentAssets);
  const totalAssets           = totalCurrentAssets + totalNonCurrentAssets;
  const totalCurrentLiab      = Sum(currentLiab);
  const totalNonCurrentLiab   = Sum(nonCurrentLiab);
  const totalLiabilities      = totalCurrentLiab + totalNonCurrentLiab;
  const totalEquity           = Sum(equityAccounts);

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
  XLSX.utils.book_append_sheet(wb, MakeSheet(XLSX, data, [32, 18, 18]), '재무상태표');
  XLSX.writeFile(wb, `${filename}_재무상태표.xlsx`);
}

export async function ExportMfgCostStatement(rows: FinanceRow[], filename: string) {
  const XLSX = await import("xlsx");
  const mfgRows = rows.filter(r => r.type === 'mfg_cost');
  const material = GroupByAccount(mfgRows.filter(r => SubClassifyMfgCost(r.account) === 'material'));
  const labor    = GroupByAccount(mfgRows.filter(r => SubClassifyMfgCost(r.account) === 'labor'));
  const overhead = GroupByAccount(mfgRows.filter(r => SubClassifyMfgCost(r.account) === 'overhead'));

  const totalMaterial = Sum(material);
  const totalLabor    = Sum(labor);
  const totalOverhead = Sum(overhead);
  const totalMfgCost  = totalMaterial + totalLabor + totalOverhead;

  const data: Row[] = [
    ['계정과목', '금액', '합계'],
    ...(material.size > 0 ? [
      ['I. 재료비', null, totalMaterial] as Row,
      ...Array.from(material.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ...(labor.size > 0 ? [
      ['II. 노무비', null, totalLabor] as Row,
      ...Array.from(labor.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ...(overhead.size > 0 ? [
      ['III. 제조경비', null, totalOverhead] as Row,
      ...Array.from(overhead.entries()).map(([a, v]): Row => [`  ${a}`, v, null]),
    ] : []),
    ['당기총제조원가', null, totalMfgCost],
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, MakeSheet(XLSX, data, [32, 18, 18]), '제조원가명세서');
  XLSX.writeFile(wb, `${filename}_제조원가명세서.xlsx`);
}