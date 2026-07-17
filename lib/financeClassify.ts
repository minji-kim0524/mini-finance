import type { AccountType } from "@/types/finance";

const currentAssetKw = ['현금', '보통예금', '당좌예금', '정기예금', '정기적금', '외화예금', '매출채권', '받을어음', '외상매출금', '미수금', '미수수익', '선급금', '선급비용', '단기대여금', '재고자산', '재공품', '저장품'];
const currentLiabilityKw = ['매입채무', '지급어음', '외상매입금', '미지급금', '미지급비용', '선수금', '예수금', '부가세예수금', '단기차입금', '유동성장기부채'];

export function SubClassify(account: string, type: 'asset' | 'liability'): 'current' | 'non_current' {
  const kws = type === 'asset' ? currentAssetKw : currentLiabilityKw;
  return kws.some(kw => account.includes(kw)) ? 'current' : 'non_current';
}

// K-IFRS 제조원가 세부 분류: 재료비 / 노무비 / 제조경비
const mfgMaterialKw = ['재료비', '원재료', '부재료', '자재'];
const mfgLaborKw = ['노무비', '임금', '급료'];

export function SubClassifyMfgCost(account: string): 'material' | 'labor' | 'overhead' {
  if (mfgMaterialKw.some(kw => account.includes(kw))) return 'material';
  if (mfgLaborKw.some(kw => account.includes(kw))) return 'labor';
  return 'overhead';
}

export const typeLabels: Record<AccountType, string> = {
  revenue: "매출",
  cogs: "매출원가",
  mfg_cost: "제조원가",
  expense: "판관비",
  non_op_income: "영업외수익",
  non_op_expense: "영업외비용",
  asset: "자산",
  liability: "부채",
  equity: "자본",
  other: "미분류",
};

export const typeColors: Record<AccountType, string> = {
  revenue: "bg-blue-100 text-blue-700",
  cogs: "bg-orange-100 text-orange-700",
  mfg_cost: "bg-yellow-100 text-yellow-700",
  expense: "bg-purple-100 text-purple-700",
  non_op_income: "bg-sky-100 text-sky-700",
  non_op_expense: "bg-pink-100 text-pink-700",
  asset: "bg-emerald-100 text-emerald-700",
  liability: "bg-rose-100 text-rose-700",
  equity: "bg-teal-100 text-teal-700",
  other: "bg-amber-100 text-amber-800",
};

export const allTypes: AccountType[] = ["revenue", "cogs", "mfg_cost", "expense", "non_op_income", "non_op_expense", "asset", "liability", "equity", "other"];
