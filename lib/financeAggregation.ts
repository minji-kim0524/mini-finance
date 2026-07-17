import type { FinanceRow } from "@/types/finance";

// 금액 표시: 음수는 괄호, 0은 대시, 원 단위
export function FmtNum(n: number): string {
  if (n === 0) return "-";
  const abs = Math.abs(n).toLocaleString("ko-KR");
  return n < 0 ? `(${abs})` : abs;
}

export function GroupByAccount(rows: FinanceRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.account, (map.get(row.account) ?? 0) + row.amount);
  }
  return map;
}

export function Sum(map: Map<string, number>): number {
  return Array.from(map.values()).reduce((s, v) => s + v, 0);
}

export function GetAmount(map: Map<string, number> | null, account: string): number | undefined {
  return map ? (map.get(account) ?? 0) : undefined;
}

export function GetDateRange(rows: FinanceRow[]): { start: string; end: string } | null {
  const dates = rows.map(r => r.date).filter(Boolean).sort();
  if (dates.length === 0) return null;
  const fmt = (d: string) => d.slice(0, 10).replace(/-/g, ".");
  return { start: fmt(dates[0]), end: fmt(dates[dates.length - 1]) };
}
