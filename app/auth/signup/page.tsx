"use client";
import Link from "next/link";
import { useState } from "react";
import { CreateClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import { ToKoreanAuthError } from "@/lib/authErrors";

type AccountType = "personal" | "business";
type BizVerifyStatus = "idle" | "loading" | "active" | "suspended" | "closed" | "invalid" | "error";

const inputCls = "mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-700";

const bizStatusStyle: Record<BizVerifyStatus, string> = {
  idle:      "",
  loading:   "text-slate-500 dark:text-slate-400",
  active:    "text-green-600 dark:text-green-400",
  suspended: "text-amber-500 dark:text-amber-400",
  closed:    "text-red-500 dark:text-red-400",
  invalid:   "text-red-500 dark:text-red-400",
  error:     "text-red-500 dark:text-red-400",
};

const bizStatusIcon: Record<BizVerifyStatus, string> = {
  idle:      "",
  loading:   "⏳",
  active:    "✓",
  suspended: "⚠",
  closed:    "✗",
  invalid:   "✗",
  error:     "✗",
};

function Required() {
  return <span className="ml-1 text-red-500">*</span>;
}

export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [bizVerifyStatus, setBizVerifyStatus] = useState<BizVerifyStatus>("idle");
  const [bizVerifyMessage, setBizVerifyMessage] = useState("");

  const supabase = CreateClient();

  function HandleAccountTypeChange(type: AccountType) {
    setAccountType(type);
    setIdentifier("");
    setError("");
    setBizVerifyStatus("idle");
    setBizVerifyMessage("");
  }

  function HandleBusinessNumberChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    let formatted = digits;
    if (digits.length > 5) formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    else if (digits.length > 3) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    setIdentifier(formatted);
    // 번호가 바뀌면 인증 초기화
    setBizVerifyStatus("idle");
    setBizVerifyMessage("");
  }

  async function HandleVerifyBusiness() {
    if (identifier.replace(/\D/g, "").length !== 10) {
      setBizVerifyStatus("error");
      setBizVerifyMessage("사업자등록번호 10자리를 모두 입력해주세요.");
      return;
    }
    setBizVerifyStatus("loading");
    setBizVerifyMessage("조회 중…");
    try {
      const res = await fetch("/api/business-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessNumber: identifier }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBizVerifyStatus("error");
        setBizVerifyMessage(json.error ?? "조회에 실패했습니다.");
        return;
      }
      setBizVerifyStatus(json.status as BizVerifyStatus);
      setBizVerifyMessage(json.message);
    } catch {
      setBizVerifyStatus("error");
      setBizVerifyMessage("네트워크 오류가 발생했습니다.");
    }
  }

  const bizVerified = bizVerifyStatus === "active" || bizVerifyStatus === "suspended";

  async function HandleSignup() {
    setError("");
    if (!name.trim()) { setError(accountType === "personal" ? "이름을 입력해주세요." : "회사명을 입력해주세요."); return; }
    if (!identifier.trim()) { setError(accountType === "personal" ? "생년월일을 입력해주세요." : "사업자등록번호를 입력해주세요."); return; }
    if (accountType === "business") {
      if (identifier.replace(/\D/g, "").length !== 10) { setError("사업자등록번호는 10자리여야 합니다. (예: 123-45-67890)"); return; }
      if (!bizVerified) { setError("사업자등록번호 조회를 먼저 완료해주세요."); return; }
    }
    if (password.length < 6) { setError("비밀번호는 최소 6자 이상이어야 합니다."); return; }
    if (password !== confirmPassword) { setError("비밀번호가 일치하지 않습니다."); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name,
          account_type: accountType,
          ...(accountType === "personal" ? { birth_date: identifier } : { business_number: identifier }),
        },
      },
    });
    setLoading(false);
    if (error) { setError(ToKoreanAuthError(error.message)); return; }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">이메일을 확인해주세요</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            인증 메일을 발송했습니다.<br />메일함을 확인하고 링크를 클릭해 가입을 완료하세요.
          </p>
          <Link href="/auth/login" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            로그인 페이지로 이동
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">회원가입</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">새 계정을 만들어 시작하세요.</p>
        </div>

        <div className="space-y-4">
          <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            {(["personal", "business"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => HandleAccountTypeChange(type)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                  accountType === type
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {type === "personal" ? "개인" : "사업자"}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {accountType === "personal" ? "이름" : "회사명"}<Required />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") HandleSignup(); }}
              placeholder={accountType === "personal" ? "홍길동" : "주식회사 예시"}
              className={inputCls}
            />
          </label>

          <div className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {accountType === "personal"
              ? "생년월일"
              : <><span>사업자등록번호</span><Required /></>
            }
            {accountType === "personal" ? (
              <input
                type="date"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") HandleSignup(); }}
                max={new Date().toISOString().slice(0, 10)}
                className={inputCls}
              />
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => HandleBusinessNumberChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") HandleVerifyBusiness(); }}
                  placeholder="000-00-00000"
                  inputMode="numeric"
                  className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-700"
                />
                <button
                  type="button"
                  onClick={HandleVerifyBusiness}
                  disabled={bizVerifyStatus === "loading" || identifier.replace(/\D/g, "").length !== 10}
                  className="shrink-0 rounded-2xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                  {bizVerifyStatus === "loading" ? "조회 중…" : "확인"}
                </button>
              </div>
            )}
            {accountType === "business" && bizVerifyStatus !== "idle" && (
              <p className={`mt-1.5 text-xs font-medium ${bizStatusStyle[bizVerifyStatus]}`}>
                {bizStatusIcon[bizVerifyStatus]} {bizVerifyMessage}
              </p>
            )}
          </div>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            이메일<Required />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") HandleSignup(); }}
              placeholder="example@email.com"
              className={inputCls}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            비밀번호<Required />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") HandleSignup(); }}
              placeholder="6자 이상"
              className={inputCls}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            비밀번호 확인<Required />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") HandleSignup(); }}
              placeholder="비밀번호 확인"
              className={inputCls}
            />
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="button"
            onClick={HandleSignup}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "가입 중…" : "회원가입"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            로그인
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
          <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-300">
            개인정보처리방침
          </Link>
        </p>
      </section>
    </div>
  );
}
