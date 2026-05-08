export type AccountType = 'revenue' | 'cogs' | 'expense' | 'non_op_income' | 'non_op_expense' | 'asset' | 'liability' | 'equity' | 'other';

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
  totalNonOpIncome: number;
  totalNonOpExpense: number;
  netIncome: number;
}
