import Link from "next/link";

export function PlanBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        무료 플랜 · <span className="font-semibold text-slate-700 dark:text-slate-300">{count}/3</span> 리포트 사용 중
      </span>
      <Link href="/pricing" className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400">
        Pro 업그레이드 →
      </Link>
    </div>
  );
}

export function UpgradeBanner() {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-900/20">
      <div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">리포트 3개 한도 도달</p>
        <p className="text-xs text-amber-600 mt-0.5 dark:text-amber-400">Pro로 업그레이드하면 무제한으로 저장할 수 있어요.</p>
      </div>
      <Link href="/pricing" className="shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600">
        업그레이드
      </Link>
    </div>
  );
}
