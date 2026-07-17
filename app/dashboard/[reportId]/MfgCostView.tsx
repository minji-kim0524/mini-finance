"use client";

import { useMemo } from "react";
import type { FinanceRow } from "@/types/finance";
import { GroupByAccount, Sum, GetAmount } from "@/lib/financeAggregation";
import { SubClassifyMfgCost } from "@/lib/financeClassify";
import { SectionRow, SubtotalRow, AccountRow, EmptyState } from "./FinanceTableRows";
import StatementCard from "./StatementCard";

export default function MfgCostView({ rows, compareRows }: { rows: FinanceRow[]; compareRows?: FinanceRow[] }) {
  const mfgRows  = rows.filter(r => r.type === 'mfg_cost');
  const cMfgRows = compareRows?.filter(r => r.type === 'mfg_cost') ?? null;

  const material = useMemo(() => GroupByAccount(mfgRows.filter(r => SubClassifyMfgCost(r.account) === 'material')), [rows]);
  const labor    = useMemo(() => GroupByAccount(mfgRows.filter(r => SubClassifyMfgCost(r.account) === 'labor')),    [rows]);
  const overhead = useMemo(() => GroupByAccount(mfgRows.filter(r => SubClassifyMfgCost(r.account) === 'overhead')), [rows]);

  const cMaterial = useMemo(() => cMfgRows ? GroupByAccount(cMfgRows.filter(r => SubClassifyMfgCost(r.account) === 'material')) : null, [compareRows]);
  const cLabor    = useMemo(() => cMfgRows ? GroupByAccount(cMfgRows.filter(r => SubClassifyMfgCost(r.account) === 'labor'))    : null, [compareRows]);
  const cOverhead = useMemo(() => cMfgRows ? GroupByAccount(cMfgRows.filter(r => SubClassifyMfgCost(r.account) === 'overhead')) : null, [compareRows]);

  const totalMaterial = Sum(material);
  const totalLabor    = Sum(labor);
  const totalOverhead = Sum(overhead);
  const totalMfgCost  = totalMaterial + totalLabor + totalOverhead;

  const cTotalMaterial = cMaterial ? Sum(cMaterial) : undefined;
  const cTotalLabor    = cLabor    ? Sum(cLabor)    : undefined;
  const cTotalOverhead = cOverhead ? Sum(cOverhead) : undefined;
  const cTotalMfgCost  = cTotalMaterial !== undefined && cTotalLabor !== undefined && cTotalOverhead !== undefined
    ? cTotalMaterial + cTotalLabor + cTotalOverhead : undefined;

  if (mfgRows.length === 0) return <EmptyState />;

  const compare = !!compareRows;

  return (
    <StatementCard title="제조원가명세서" currentRangeRows={mfgRows} compareRangeRows={cMfgRows} hasCompare={compare}>
      {/* I. 재료비 */}
      {material.size > 0 && (
        <>
          <SectionRow roman="I." label="재료비" total={totalMaterial} compareTotal={cTotalMaterial} />
          {Array.from(material.entries()).map(([account, amount]) => (
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cMaterial, account)} />
          ))}
        </>
      )}

      {/* II. 노무비 */}
      {labor.size > 0 && (
        <>
          <SectionRow roman="II." label="노무비" total={totalLabor} compareTotal={cTotalLabor} />
          {Array.from(labor.entries()).map(([account, amount]) => (
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cLabor, account)} />
          ))}
        </>
      )}

      {/* III. 제조경비 */}
      {overhead.size > 0 && (
        <>
          <SectionRow roman="III." label="제조경비" total={totalOverhead} compareTotal={cTotalOverhead} />
          {Array.from(overhead.entries()).map(([account, amount]) => (
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cOverhead, account)} />
          ))}
        </>
      )}

      {/* 당기총제조원가 */}
      <SubtotalRow label="당기총제조원가" value={totalMfgCost} compareValue={cTotalMfgCost} bold />
    </StatementCard>
  );
}