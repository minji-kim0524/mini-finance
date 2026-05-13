"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toKoreanAuthError } from "@/lib/auth-errors";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        setError("유효하지 않은 링크입니다. 비밀번호 찾기를 다시 시도해주세요.");
      }
    });
  }, []);

  async function handleReset() {
    setError("");

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(toKoreanAuthError(error.message));
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">비밀번호가 변경되었습니다</h2>
          <p className="mt-2 text-sm text-slate-500">새 비밀번호로 로그인해주세요.</p>
          <button
            type="button"
            onClick={() => router.push("/auth/login")}
            className="mt-6 inline-block rounded-2xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            로그인하러 가기
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">새 비밀번호 설정</h1>
          <p className="mt-2 text-sm text-slate-500">새로 사용할 비밀번호를 입력해주세요.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            새 비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleReset(); }}
              placeholder="6자 이상"
              disabled={!sessionReady}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-50"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            비밀번호 확인
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleReset(); }}
              placeholder="비밀번호 확인"
              disabled={!sessionReady}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white disabled:opacity-50"
            />
          </label>

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{error}</p>
              {!sessionReady && (
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  비밀번호 찾기 다시 시도
                </Link>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleReset}
            disabled={loading || !sessionReady}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "변경 중…" : "비밀번호 변경"}
          </button>
        </div>
      </section>
    </div>
  );
}
