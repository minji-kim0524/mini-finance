"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateClient } from "@/lib/supabase/client";

interface UserMenuProps {
  name: string | null;
  email: string;
  plan?: string;
  hasCustomerId?: boolean;
}

export default function UserMenu({ name, email, plan, hasCustomerId }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = CreateClient();

  useEffect(() => {
    function HandleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", HandleClickOutside);
    return () => document.removeEventListener("mousedown", HandleClickOutside);
  }, []);

  async function HandleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  async function HandlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } finally {
      setPortalLoading(false);
    }
  }

  const initials = (name ?? email).slice(0, 2).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 transition hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
        aria-label="사용자 메뉴"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-900/60">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{name ?? "사용자"}</p>
              {plan === "pro" ? (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">Pro</span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">Free</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{email}</p>
          </div>
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="block w-full px-4 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            프로필 설정
          </Link>
          {plan !== "pro" && (
            <a
              href="/pricing"
              className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              Pro 업그레이드
            </a>
          )}
          {plan === "pro" && hasCustomerId && (
            <button
              type="button"
              onClick={HandlePortal}
              disabled={portalLoading}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {portalLoading ? "이동 중…" : "구독 관리"}
            </button>
          )}
          <button
            type="button"
            onClick={HandleLogout}
            className="w-full px-4 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
