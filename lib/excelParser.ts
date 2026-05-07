import * as XLSX from 'xlsx';
import { classifyAccount } from './accountClassifier';
import type { FinanceRow } from '@/types/finance';

const DATE_COLS = ['날짜', 'date', 'Date', '거래일', '일자'];
const ACCOUNT_COLS = ['계정', '계정과목', 'account', 'Account', '항목'];
const AMOUNT_COLS = ['금액', 'amount', 'Amount', '거래금액', '공급가액'];

function findKey(row: Record<string, unknown>, candidates: string[]): string | undefined {
  return candidates.find((k) => k in row);
}

function toDateString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
  }
  return String(value ?? '');
}

export function parseExcel(buffer: Buffer): FinanceRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return rawRows
    .map((row) => {
      const dateKey = findKey(row, DATE_COLS);
      const accountKey = findKey(row, ACCOUNT_COLS);
      const amountKey = findKey(row, AMOUNT_COLS);

      const date = dateKey ? toDateString(row[dateKey]) : '';
      const account = accountKey ? String(row[accountKey]) : '';
      const amount = amountKey ? Number(row[amountKey]) : 0;

      return { date, account, amount, type: classifyAccount(account) } satisfies FinanceRow;
    })
    .filter((row) => row.date !== '' && row.amount !== 0 && !Number.isNaN(row.amount));
}
