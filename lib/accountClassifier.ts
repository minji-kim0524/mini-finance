import type { AccountType } from '@/types/finance';

const REVENUE_KEYWORDS = ['매출', '수입', '용역수익', '매출액', '서비스수익'];
const COGS_KEYWORDS = ['매입', '원가', '재료비', '상품원가', '제품원가'];
const EXPENSE_KEYWORDS = ['급여', '임차료', '광고비', '접대비', '통신비', '소모품', '감가상각', '보험료', '수수료', '복리후생'];

export function classifyAccount(account: string): AccountType {
  if (REVENUE_KEYWORDS.some((kw) => account.includes(kw))) return 'revenue';
  if (COGS_KEYWORDS.some((kw) => account.includes(kw))) return 'cogs';
  if (EXPENSE_KEYWORDS.some((kw) => account.includes(kw))) return 'expense';
  return 'other';
}
