"use client";

import { Mail } from "lucide-react";

const TO = "always00524@gmail.com";

export default function ContactFooter() {
  return (
    <footer className="flex items-center justify-end border-t border-slate-200 px-6 py-4 dark:border-slate-800">
      <a
        href={`mailto:${TO}?subject=${encodeURIComponent("[고객지원] 문의드립니다")}`}
        aria-label="의견 보내기"
        className="group relative flex items-center justify-center rounded-full p-2 text-slate-400 transition hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400"
      >
        <Mail size={18} />
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-slate-700">
          의견 보내기
        </span>
      </a>
    </footer>
  );
}
