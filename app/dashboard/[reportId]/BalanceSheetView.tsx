import type { FinanceRow } from "@/types/finance";
import { GroupByAccount, Sum, GetAmount, FmtNum } from "@/lib/financeAggregation";
import { SubClassify } from "@/lib/financeClassify";
import { SectionRow, SubtotalRow, AccountRow, CategoryRow, EmptyState } from "./FinanceTableRows";
import StatementCard from "./StatementCard";

export default function BalanceSheetView({ rows, compareRows }: { rows: FinanceRow[]; compareRows?: FinanceRow[] }) {
  const assets      = rows.filter(r => r.type === "asset");
  const liabilities = rows.filter(r => r.type === "liability");
  const equity      = rows.filter(r => r.type === "equity");

  if (assets.length === 0 && liabilities.length === 0 && equity.length === 0) return <EmptyState />;

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
  const totalLiabAndEquity    = totalLiabilities + totalEquity;

  // 전기 데이터
  const cAssets      = compareRows ? compareRows.filter(r => r.type === "asset")     : null;
  const cLiabilities = compareRows ? compareRows.filter(r => r.type === "liability") : null;
  const cEquity      = compareRows ? compareRows.filter(r => r.type === "equity")    : null;

  const cCurrentAssets    = cAssets      ? GroupByAccount(cAssets.filter(r => SubClassify(r.account, 'asset') === 'current'))          : null;
  const cNonCurrentAssets = cAssets      ? GroupByAccount(cAssets.filter(r => SubClassify(r.account, 'asset') === 'non_current'))      : null;
  const cCurrentLiab      = cLiabilities ? GroupByAccount(cLiabilities.filter(r => SubClassify(r.account, 'liability') === 'current')) : null;
  const cNonCurrentLiab   = cLiabilities ? GroupByAccount(cLiabilities.filter(r => SubClassify(r.account, 'liability') === 'non_current')) : null;
  const cEquityAccounts   = cEquity      ? GroupByAccount(cEquity)                                                                     : null;

  const cTotalCurrentAssets    = cCurrentAssets    ? Sum(cCurrentAssets)    : undefined;
  const cTotalNonCurrentAssets = cNonCurrentAssets ? Sum(cNonCurrentAssets) : undefined;
  const cTotalAssets           = cTotalCurrentAssets !== undefined && cTotalNonCurrentAssets !== undefined ? cTotalCurrentAssets + cTotalNonCurrentAssets : undefined;
  const cTotalCurrentLiab      = cCurrentLiab      ? Sum(cCurrentLiab)      : undefined;
  const cTotalNonCurrentLiab   = cNonCurrentLiab   ? Sum(cNonCurrentLiab)   : undefined;
  const cTotalLiabilities      = cTotalCurrentLiab !== undefined && cTotalNonCurrentLiab !== undefined ? cTotalCurrentLiab + cTotalNonCurrentLiab : undefined;
  const cTotalEquity           = cEquityAccounts   ? Sum(cEquityAccounts)   : undefined;
  const cTotalLiabAndEquity    = cTotalLiabilities !== undefined && cTotalEquity !== undefined ? cTotalLiabilities + cTotalEquity : undefined;

  const compare = !!compareRows;
  const colSpan = compare ? 4 : 3;

  return (
    <StatementCard title="재무상태표" currentRangeRows={rows} compareRangeRows={compareRows} hasCompare={compare}>
      {/* ── 자산 ── */}
      <CategoryRow label="자  산" colSpan={colSpan} />

      {currentAssets.size > 0 && (
        <>
          <SectionRow roman="I." label="유동자산" total={totalCurrentAssets} compareTotal={cTotalCurrentAssets} />
          {Array.from(currentAssets.entries()).map(([account, amount]) => (
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cCurrentAssets, account)} />
          ))}
        </>
      )}

      {nonCurrentAssets.size > 0 && (
        <>
          <SectionRow roman="II." label="비유동자산" total={totalNonCurrentAssets} compareTotal={cTotalNonCurrentAssets} />
          {Array.from(nonCurrentAssets.entries()).map(([account, amount]) => (
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cNonCurrentAssets, account)} />
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
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cCurrentLiab, account)} />
          ))}
        </>
      )}

      {nonCurrentLiab.size > 0 && (
        <>
          <SectionRow roman="II." label="비유동부채" total={totalNonCurrentLiab} compareTotal={cTotalNonCurrentLiab} />
          {Array.from(nonCurrentLiab.entries()).map(([account, amount]) => (
            <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cNonCurrentLiab, account)} />
          ))}
        </>
      )}

      <SubtotalRow label="부채 총계" value={totalLiabilities} compareValue={cTotalLiabilities} bold />

      {/* ── 자본 ── */}
      <CategoryRow label="자  본" colSpan={colSpan} />

      {Array.from(equityAccounts.entries()).map(([account, amount]) => (
        <AccountRow key={account} account={account} amount={amount} compareAmount={GetAmount(cEquityAccounts, account)} />
      ))}

      <SubtotalRow label="자본 총계" value={totalEquity} compareValue={cTotalEquity} bold />

      {/* 부채 및 자본 총계 */}
      <tr className="border-t-2 border-slate-800 bg-slate-900">
        <td className="py-3 pl-5 text-sm font-bold text-white">부채 및 자본 총계</td>
        <td className="py-3 pr-3" />
        <td className={`py-3 text-right text-sm font-bold text-white ${compare ? "pr-3" : "pr-5"}`}>{FmtNum(totalLiabAndEquity)}</td>
        {compare && (
          <td className="py-3 pr-5 text-right text-sm font-bold text-blue-300">{cTotalLiabAndEquity !== undefined ? FmtNum(cTotalLiabAndEquity) : "-"}</td>
        )}
      </tr>
    </StatementCard>
  );
}