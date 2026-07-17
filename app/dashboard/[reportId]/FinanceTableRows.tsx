import { FmtNum } from "@/lib/financeAggregation";

export function TableHeader({ compare, currentYear, compareYear }: { compare?: boolean; currentYear?: string; compareYear?: string }) {
  return (
    <thead>
      <tr className="border-b-2 border-slate-200">
        <th className="py-2.5 pl-5 text-left text-xs font-semibold text-slate-500">계정과목</th>
        <th className="py-2.5 pr-3 text-right text-xs font-semibold text-slate-500">금액</th>
        <th className={`py-2.5 text-right text-xs font-semibold text-slate-500 ${compare ? "pr-3" : "pr-5"}`}>
          {compare ? (currentYear ? `당기(${currentYear})` : "당기") : "합계"}
        </th>
        {compare && (
          <th className="py-2.5 pr-5 text-right text-xs font-semibold text-blue-400">
            {compareYear ? `전기(${compareYear})` : "전기"}
          </th>
        )}
      </tr>
    </thead>
  );
}

// 섹션 헤더 행 (I. 매출액 등)
export function SectionRow({ roman, label, total, compareTotal, highlight }: { roman: string; label: string; total: number; compareTotal?: number; highlight?: boolean }) {
  const hasCompare = compareTotal !== undefined;
  return (
    <tr className={highlight ? "border-t-2 border-slate-300 bg-slate-50" : "border-t border-slate-100 bg-slate-50"}>
      <td className={`py-2.5 pl-5 text-sm ${highlight ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
        <span className="mr-1.5 text-xs font-normal text-slate-400">{roman}</span>{label}
      </td>
      <td className="py-2.5 pr-3" />
      <td className={`py-2.5 text-right text-sm ${hasCompare ? "pr-3" : "pr-5"} ${highlight ? "font-bold" : "font-semibold"} ${total < 0 ? "text-red-500" : highlight ? "text-blue-600" : "text-slate-900"}`}>
        {FmtNum(total)}
      </td>
      {hasCompare && (
        <td className={`py-2.5 pr-5 text-right text-sm ${highlight ? "font-bold" : "font-semibold"} ${compareTotal < 0 ? "text-red-300" : "text-blue-300"}`}>
          {FmtNum(compareTotal)}
        </td>
      )}
    </tr>
  );
}

// 소계 행 (매출총이익, 영업이익 등)
export function SubtotalRow({ label, value, compareValue, bold }: { label: string; value: number; compareValue?: number; bold?: boolean }) {
  const hasCompare = compareValue !== undefined;
  return (
    <tr className="border-t-2 border-slate-300 bg-slate-50">
      <td className={`py-2.5 pl-5 text-sm ${bold ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>{label}</td>
      <td className="py-2.5 pr-3" />
      <td className={`py-2.5 text-right text-sm ${hasCompare ? "pr-3" : "pr-5"} ${bold ? "font-bold" : "font-semibold"} ${value < 0 ? "text-red-500" : "text-blue-600"}`}>
        {FmtNum(value)}
      </td>
      {hasCompare && (
        <td className={`py-2.5 pr-5 text-right text-sm ${bold ? "font-bold" : "font-semibold"} ${compareValue < 0 ? "text-red-300" : "text-blue-300"}`}>
          {FmtNum(compareValue)}
        </td>
      )}
    </tr>
  );
}

// 세부 계정 행 (들여쓰기)
export function AccountRow({ account, amount, compareAmount, indent = 1 }: { account: string; amount: number; compareAmount?: number; indent?: number }) {
  const hasCompare = compareAmount !== undefined;
  return (
    <tr className="border-t border-slate-50 hover:bg-slate-50/60">
      <td className={`py-1.5 text-xs text-slate-500 ${indent === 2 ? "pl-14" : "pl-9"}`}>{account}</td>
      <td className={`py-1.5 text-right text-xs text-slate-500 ${hasCompare ? "pr-3" : "pr-3"}`}>{FmtNum(amount)}</td>
      <td className={`py-1.5 ${hasCompare ? "pr-3" : "pr-5"}`} />
      {hasCompare && (
        <td className="py-1.5 pr-5 text-right text-xs text-blue-300">{FmtNum(compareAmount)}</td>
      )}
    </tr>
  );
}

// 섹션 제목 행 (자산, 부채, 자본)
export function CategoryRow({ label, colSpan = 3 }: { label: string; colSpan?: number }) {
  return (
    <tr className="bg-slate-800">
      <td colSpan={colSpan} className="px-5 py-2 text-xs font-bold tracking-widest text-slate-100">
        {label}
      </td>
    </tr>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-500">표시할 데이터가 없습니다.</p>
    </div>
  );
}