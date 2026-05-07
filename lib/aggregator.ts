import type { FinanceRow, MonthlyData, PLSummary } from '@/types/finance';

function accumulate(map: Map<string, MonthlyData>, key: string, row: FinanceRow) {
  if (!map.has(key)) map.set(key, { month: key, revenue: 0, cogs: 0, expense: 0 });
  const entry = map.get(key)!;
  if (row.type === 'revenue') entry.revenue += row.amount;
  else if (row.type === 'cogs') entry.cogs += row.amount;
  else if (row.type === 'expense') entry.expense += row.amount;
}

export function groupByMonth(rows: FinanceRow[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();
  for (const row of rows) {
    const yy = row.date.slice(2, 4);
    const mm = row.date.slice(5, 7);
    accumulate(map, `${yy}.${mm}`, row);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function groupByQuarter(rows: FinanceRow[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();
  for (const row of rows) {
    const yy = row.date.slice(2, 4);
    const q = Math.ceil(parseInt(row.date.slice(5, 7)) / 3);
    accumulate(map, `${yy} Q${q}`, row);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function groupBySemiAnnual(rows: FinanceRow[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();
  for (const row of rows) {
    const yy = row.date.slice(2, 4);
    const half = parseInt(row.date.slice(5, 7)) <= 6 ? '상' : '하';
    accumulate(map, `${yy} ${half}`, row);
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
