"use client";

import { useState } from "react";

const TO = "always00524@gmail.com";

export default function ContactForm() {
  const [name, setName]       = useState("");
  const [message, setMessage] = useState("");

  function HandleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`[고객의견] ${name || "익명"} 님의 문의`);
    const body    = encodeURIComponent(
      name ? `이름: ${name}\n\n${message}` : message,
    );
    window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`;
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/30";

  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-lg">
        <h3 className="mb-1 text-sm font-semibold text-slate-800 dark:text-slate-200">고객 의견 보내기</h3>
        <p className="mb-5 text-xs text-slate-400 dark:text-slate-500">
          서비스 개선을 위한 의견을 남겨주세요. 기본 메일 앱이 열리며 전송됩니다.
        </p>
        <form onSubmit={HandleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="이름 (선택)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
          <textarea
            placeholder="문의 내용을 입력해주세요."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            className={`${inputCls} resize-none`}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              의견 보내기
            </button>
          </div>
        </form>
      </div>
    </footer>
  );
}
