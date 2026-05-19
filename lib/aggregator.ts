import type { FinanceRow, MonthlyData, PLSummary } from '@/types/finance';

function Accumulate(map: Map<string, MonthlyData>, key: string, row: FinanceRow) {
  if (!map.has(key)) map.set(key, { month: key, revenue: 0, cogs: 0, expense: 0 });
  const entry = map.get(key)!;
  if (row.type === 'revenue') entry.revenue += row.amount;
  else if (row.type === 'cogs') entry.cogs += row.amount;
  else if (row.type === 'expense') entry.expense += row.amount;
}

export function GroupByMonth(rows: FinanceRow[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();
  for (const row of rows) {
    const yy = row.date.slice(2, 4);
    const mm = row.date.slice(5, 7);
    Accumulate(map, `${yy}.${mm}`, row);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function GroupByQuarter(rows: FinanceRow[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();
  for (const row of rows) {
    const yy = row.date.slice(2, 4);
    const q = Math.ceil(parseInt(row.date.slice(5, 7)) / 3);
    Accumulate(map, `${yy} Q${q}`, row);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function GroupBySemiAnnual(rows: FinanceRow[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();
  for (const row of rows) {
    const yy = row.date.slice(2, 4);
    const half = parseInt(row.date.slice(5, 7)) <= 6 ? '상' : '하';
    Accumulate(map, `${yy} ${half}`, row);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function GroupByYear(rows: FinanceRow[]): MonthlyData[] {
  const map = new Map<string, MonthlyData>();
  for (const row of rows) {
    const yyyy = row.date.slice(0, 4);
    Accumulate(map, yyyy, row);
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export interface PredictPoint {
  month: string;
  revenue: number | null;
  profit: number | null;
  predictRevenue: number | null;
  predictProfit: number | null;
}

function LinReg(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  let sx = 0, sy = 0, sxy = 0, sx2 = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += values[i]; sxy += i * values[i]; sx2 += i * i; }
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  return { slope, intercept: (sy - slope * sx) / n };
}

function AddMonths(label: string, offset: number): string {
  const yy = parseInt(label.slice(0, 2));
  const mm = parseInt(label.slice(3, 5));
  const base = yy * 12 + (mm - 1) + offset;
  return `${String(Math.floor(base / 12)).padStart(2, "0")}.${String((base % 12) + 1).padStart(2, "0")}`;
}

export function BuildPredictSeries(rows: FinanceRow[], futureMonths = 3): PredictPoint[] {
  const monthly = GroupByMonth(rows);
  if (monthly.length === 0) return [];

  const revenues = monthly.map((d) => d.revenue);
  const profits  = monthly.map((d) => d.revenue - d.cogs - d.expense);
  const revReg   = LinReg(revenues);
  const profReg  = LinReg(profits);
  const n        = monthly.length;

  const actual: PredictPoint[] = monthly.map((d, i) => ({
    month:          d.month,
    revenue:        d.revenue,
    profit:         d.revenue - d.cogs - d.expense,
    predictRevenue: i === n - 1 ? d.revenue : null,
    predictProfit:  i === n - 1 ? d.revenue - d.cogs - d.expense : null,
  }));

  const future: PredictPoint[] = Array.from({ length: futureMonths }, (_, i) => ({
    month:          AddMonths(monthly[n - 1].month, i + 1),
    revenue:        null,
    profit:         null,
    predictRevenue: Math.round(revReg.intercept + revReg.slope * (n + i)),
    predictProfit:  Math.round(profReg.intercept + profReg.slope * (n + i)),
  }));

  return [...actual, ...future];
}

export function CalcPLSummary(rows: FinanceRow[]): PLSummary {
  let totalRevenue = 0;
  let totalCogs = 0;
  let totalExpense = 0;
  let totalNonOpIncome = 0;
  let totalNonOpExpense = 0;

  for (const row of rows) {
    if (row.type === 'revenue') totalRevenue += row.amount;
    else if (row.type === 'cogs') totalCogs += row.amount;
    else if (row.type === 'expense') totalExpense += row.amount;
    else if (row.type === 'non_op_income') totalNonOpIncome += row.amount;
    else if (row.type === 'non_op_expense') totalNonOpExpense += row.amount;
  }

  const grossProfit = totalRevenue - totalCogs;
  const operatingProfit = grossProfit - totalExpense;
  const netIncome = operatingProfit + totalNonOpIncome - totalNonOpExpense;

  return { totalRevenue, totalCogs, grossProfit, totalExpense, operatingProfit, totalNonOpIncome, totalNonOpExpense, netIncome };
}
