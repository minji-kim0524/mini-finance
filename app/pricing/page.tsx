"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const json = await res.json();
      if (res.status === 401) { router.push("/auth/login"); return; }
      if (!res.ok || !json.url) { setError(json.error ?? "결제 세션 생성에 실패했습니다. 다시 시도해 주세요."); return; }
      window.location.href = json.url;
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">플랜 선택</h1>
          <p className="text-slate-500 dark:text-slate-400">지금 시작하고 Pro로 무제한 분석하세요.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 space-y-5 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Free</p>
              <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100">₩0</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">무료로 시작</p>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <FeatureItem>리포트 최대 3개 저장</FeatureItem>
              <FeatureItem>손익계산서 자동 분석</FeatureItem>
              <FeatureItem>재무상태표 자동 분석</FeatureItem>
              <FeatureItem>계정 분류 수동 수정</FeatureItem>
            </ul>
            <Link
              href="/dashboard"
              className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              현재 플랜
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-3xl border-2 border-blue-500 bg-white p-7 space-y-5 relative dark:bg-slate-900">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
              추천
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Pro</p>
              <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100">₩9,900</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">월 구독</p>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <FeatureItem accent>리포트 무제한 저장</FeatureItem>
              <FeatureItem accent>손익계산서 자동 분석</FeatureItem>
              <FeatureItem accent>재무상태표 자동 분석</FeatureItem>
              <FeatureItem accent>계정 분류 수동 수정</FeatureItem>
              <FeatureItem accent>전기/당기 비교 분석</FeatureItem>
              <FeatureItem accent>PDF · 엑셀 내보내기</FeatureItem>
            </ul>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "이동 중…" : "Pro 시작하기"}
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          언제든지 취소 가능 · Stripe으로 안전하게 결제
        </p>
      </div>
    </div>
  );
}

function FeatureItem({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <svg className={`h-4 w-4 shrink-0 ${accent ? "text-blue-500" : "text-slate-400 dark:text-slate-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      {children}
    </li>
  );
}
