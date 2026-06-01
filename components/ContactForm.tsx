"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function HandleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    if (res.ok) {
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      const json = await res.json() as { error?: string };
      setErrorMsg(json.error ?? "메일 전송에 실패했습니다.");
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/30";

  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-lg">
        <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">고객 의견 보내기</h3>
        <p className="mb-5 text-xs text-slate-400 dark:text-slate-500">서비스 개선을 위한 의견을 남겨주세요. 소중히 검토하겠습니다.</p>

        {status === "success" ? (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            의견이 성공적으로 전송되었습니다. 감사합니다!
          </div>
        ) : (
          <form onSubmit={HandleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="이름 (선택)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
              <input
                type="email"
                placeholder="이메일 (선택)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <textarea
              placeholder="문의 내용을 입력해주세요."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              className={`${inputCls} resize-none`}
            />
            {status === "error" && (
              <p className="text-xs text-red-500 dark:text-red-400">{errorMsg}</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {status === "loading" ? "전송 중…" : "의견 보내기"}
              </button>
            </div>
          </form>
        )}
      </div>
    </footer>
  );
}
