"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import { ToKoreanAuthError } from "@/lib/authErrors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = CreateClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get("error");
    const shouldSignOut = params.get("signout") === "1";
    if (callbackError) {
      setError(shouldSignOut ? callbackError : `소셜 로그인 실패: ${callbackError}`);
    }
    if (shouldSignOut) {
      supabase.auth.signOut();
    }
  }, []);

  async function HandleLogin() {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(ToKoreanAuthError(error.message));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function HandleSocialLogin(provider: "google" | "kakao") {
    setError("");

    const kakaoOptions =
      provider === "kakao"
        ? { scopes: "profile_nickname profile_image account_email" }
        : {};

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        ...kakaoOptions,
      },
    });
    if (error) {
      setError(ToKoreanAuthError(error.message));
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mb-8 text-center">
        <p className="text-xs tracking-wide text-slate-400 dark:text-slate-500">
          최소한의 데이터로 재무상태를 시각화 해주는
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <img src="/finance-favicon.svg" alt="MINI-Finance 로고" className="h-8 w-8 dark:invert" />
          <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            MINI-Finance
          </span>
        </div>
      </div>

      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/60">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">로그인</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">이메일과 비밀번호로 로그인하세요.</p>
        </div>

        <div className="space-y-4">
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            이메일
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") HandleLogin(); }}
              placeholder="example@email.com"
              required
              autoComplete="email"
              aria-describedby={error ? "login-error" : undefined}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-700"
            />
          </label>

          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            비밀번호
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") HandleLogin(); }}
              placeholder="비밀번호"
              required
              autoComplete="current-password"
              aria-describedby={error ? "login-error" : undefined}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-700"
            />
          </label>

          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          {error && <p id="login-error" role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="button"
            onClick={HandleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
            <span className="text-xs text-slate-400 dark:text-slate-500">또는</span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => HandleSocialLogin("kakao")}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191919] transition hover:bg-[#F5DC00]"
            >
              <KakaoIcon />
              카카오로 로그인
            </button>
            <button
              type="button"
              onClick={() => HandleSocialLogin("google")}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <GoogleIcon />
              Google로 로그인
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          계정이 없으신가요?{' '}
          <Link href="/auth/signup" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            회원가입
          </Link>
        </p>
      </section>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M9 0.5C4.305 0.5 0.5 3.467 0.5 7.12c0 2.335 1.556 4.39 3.905 5.545l-.99 3.698c-.088.327.374.589.637.356l4.306-3.026c.21.016.423.025.642.025 4.695 0 8.5-2.967 8.5-6.62C17.5 3.467 13.695.5 9 .5z" fill="#191919"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
