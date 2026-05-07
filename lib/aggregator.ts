import type { FinanceRow, MonthlyData, PLSummary } from '@/types/finance';

export function groupByMonth(rows: FinanceRow[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();

  for (const row of rows) {
    const month = row.date.slice(0, 7);
    if (!map.has(month)) {
      map.set(month, { month, revenue: 0, cogs: 0, expense: 0 });
    }
    const entry = map.get(month)!;
    if (row.type === 'revenue') entry.revenue += row.amount;
    else if (row.type === 'cogs') entry.cogs += row.amount;
    else if (row.type === 'expense') entry.expense += row.amount;
  }

  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function calcPLSummary(rows: FinanceRow[]): PLSummary {
  let totalRevenue = 0;
  let totalCogs = 0;
  let totalExpense = 0;

  for (const row of rows) {
    if (row.type === 'revenue') totalRevenue += row.amount;
    else if (row.type === 'cogs') totalCogs += row.amount;
    else if (row.type === 'expense') totalExpense += row.amount;
  }

  const grossProfit = totalRevenue - totalCogs;
  const operatingProfit = grossProfit - totalExpense;

  return { totalRevenue, totalCogs, grossProfit, totalExpense, operatingProfit };
}
