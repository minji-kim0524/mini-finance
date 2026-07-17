"use client";

import { useMemo } from "react";
import type { FinanceRow } from "@/types/finance";
import { GroupByAccount, Sum, GetAmount } from "@/lib/financeAggregation";
import { SectionRow, SubtotalRow, AccountRow, EmptyState } from "./FinanceTableRows";
import StatementCard from "./StatementCard";

export default function IncomeStatementView({ rows, compareRows }: { rows: FinanceRow[]; compareRows?: FinanceRow[] }) {
  const revenue    = useMemo(() => GroupByAccount(rows.filter(r => r.type === "revenue")),        [rows]);
  const cogs       = useMemo(() => GroupByAccount(rows.filter(r => r.type === "cogs")),           [rows]);
  const expenses   = useMemo(() => GroupByAccount(rows.filter(r => r.type === "expense")),        [rows]);
  const nonOpInc   = useMemo(() => GroupByAccount(rows.filter(r => r.type === "non_op_income")),  [rows]);
  const nonOpExp   = useMemo(() => GroupByAccount(rows.filter(r => r.type === "non_op_expense")), [rows]);

  const cRevenue  = useMemo(() => compareRows ? GroupByAccount(compareRows.filter(r => r.type === "revenue"))        : null, [compareRows]);
  const cCogs     = useMemo(() => compareRows ? GroupByAccount(compareRows.filter(r => r.type === "cogs"))           : null, [compareRows]);
  const cExpenses = useMemo(() => compareRows ? GroupByAccount(compareRows.filter(r => r.type === "expense"))        : null, [compareRows]);
  const cNonOpInc = useMemo(() => compareRows ? GroupByAccount(compareRows.filter(r => r.type === "non_op_income"))  : null, [compareRows]);
  const cNonOpExp = useMemo(() => compareRows ? GroupByAccount(compareRows.filter(r => r.type === "non_op_expense")) : null, [compareRows]);

  const totalRevenue    = Sum(revenue);
  const totalCogs       = Sum(cogs);
  const grossProfit     = totalRevenue - totalCogs;
  const totalExpense    = Sum(expenses);
  const operatingProfit = grossProfit - totalExpense;
  const totalNonOpInc   = Sum(nonOpInc);
  const totalNonOpExp   = Sum(nonOpExp);
  const netIncome       = operatingProfit + totalNonOpInc - totalNonOpExp;

  const cTotalRevenue    = cRevenue  ? Sum(cRevenue)  : undefined;
  const cTotalCogs       = cCogs     ? Sum(cCogs)     : undefined;
  const cGrossProfit     = cTotalRevenue !== undefined && cTotalCogs !== undefined ? cTotalRevenue - cTotalCogs : undefined;
  const cTotalExpense    = cExpenses  ? Sum(cExpenses) : undefined;
  const cOperatingProfit = cGrossProfit !== undefined && cTotalExpense !== undefined ? cGrossProfit - cTotalExpense : undefined;
  const cTotalNonOpInc   = cNonOpInc ? Sum(cNonOpInc) : undefined;
  const cTotalNonOpExp   = cNonOpExp ? Sum(cNonOpExp) : undefined;
  const cNetIncome       = cOperatingProfit !== undefined && cTotalNonOpInc !== undefined && cTotalNonOpExp !== undefined
    ? cOperatingProfit + cTotalNonOpInc - cTotalNonOpExp : undefined;

  const compare = !!compareRows;
  const hasNonOp = nonOpInc.size > 0 || nonOpExp.size > 0 || (cNonOpInc && cNonOpInc.size > 0) || (cNonOpExp && cNonOpExp.size > 0);

  if (revenue.size === 0 && cogs.size === 0 && expenses.size === 0 && !hasNonOp) return <EmptyState />;

  return (
    <StatementCard title="손익계산서" currentRangeRows={rows} compareRangeRows={compareRows} hasCompare={compare}>
      {/* I. 매출액 */}
      <SectionRow roman="I." label="매출액" total={totalRevenue} compareTotal={cTotalRevenue} />
      {Array.from(revenue.entries()).map(([account, amount]) => (
        <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cRevenue, account)} />
      ))}

      {/* II. 매출원가 */}
      {(cogs.size > 0 || (cCogs && cCogs.size > 0)) && (
        <>
          <SectionRow roman="II." label="매출원가" total={totalCogs} compareTotal={cTotalCogs} />
          {Array.from(cogs.entries()).map(([account, amount]) => (
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cCogs, account)} />
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
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cExpenses, account)} />
          ))}
        </>
      )}

      {/* V. 영업이익 */}
      <SubtotalRow label="V. 영업이익" value={operatingProfit} compareValue={cOperatingProfit} bold={!hasNonOp} />

      {/* VI. 영업외수익 */}
      {(nonOpInc.size > 0 || (cNonOpInc && cNonOpInc.size > 0)) && (
        <>
          <SectionRow roman="VI." label="영업외수익" total={totalNonOpInc} compareTotal={cTotalNonOpInc} />
          {Array.from(nonOpInc.entries()).map(([account, amount]) => (
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cNonOpInc, account)} />
          ))}
        </>
      )}

      {/* VII. 영업외비용 */}
      {(nonOpExp.size > 0 || (cNonOpExp && cNonOpExp.size > 0)) && (
        <>
          <SectionRow roman="VII." label="영업외비용" total={totalNonOpExp} compareTotal={cTotalNonOpExp} />
          {Array.from(nonOpExp.entries()).map(([account, amount]) => (
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cNonOpExp, account)} />
          ))}
        </>
      )}

      {/* VIII. 당기순이익 */}
      {hasNonOp && <SubtotalRow label="VIII. 당기순이익" value={netIncome} compareValue={cNetIncome} bold />}
    </StatementCard>
  );
}