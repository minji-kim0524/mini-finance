export type AccountType = 'revenue' | 'cogs' | 'expense' | 'other';

export interface FinanceRow {
  date: string;
  account: string;
  amount: number;
  type: AccountType;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  cogs: number;
  expense: number;
}

export interface PLSummary {
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalExpense: number;
  operatingProfit: number;
}
