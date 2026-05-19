"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import { toKoreanAuthError } from "@/lib/authErrors";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(toKoreanAuthError(error.message));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-900/60">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">로그인</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">이메일과 비밀번호로 로그인하세요.</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            이메일
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              placeholder="example@email.com"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-700"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              placeholder="비밀번호"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-700"
            />
          </label>

          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "로그인 중…" : "로그인"}
          </button>
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
