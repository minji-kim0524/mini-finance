"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateClient } from "@/lib/supabase/client";

interface Props {
  name: string | null;
  email: string;
  plan: string;
}

export default function ProfileClient({ name, email, plan }: Props) {
  const [nameValue, setNameValue] = useState(name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = CreateClient();

  async function HandleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameMessage(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNameMessage({ type: "error", text: json.error ?? "저장 실패" });
      } else {
        setNameMessage({ type: "success", text: "이름이 변경되었습니다." });
        router.refresh();
      }
    } catch {
      setNameMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setNameSaving(false);
    }
  }

  async function HandleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setDeleteError(json.error ?? "탈퇴 처리 중 오류가 발생했습니다.");
        return;
      }
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch {
      setDeleteError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  const deleteConfirmPhrase = "탈퇴하겠습니다";

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">프로필 설정</h1>

      {/* 계정 정보 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-500 uppercase tracking-wide dark:text-slate-400">계정 정보</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">이름</p>
            <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">{nameValue || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">이메일</p>
            <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">{email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500">요금제</p>
            <p className="mt-0.5">
              {plan === "pro" ? (
                <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">Pro</span>
              ) : (
                <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">무료</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 이름 변경 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-500 uppercase tracking-wide dark:text-slate-400">이름 변경</h2>
        <form onSubmit={HandleNameSave} className="space-y-3">
          <input
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
          />
          {nameMessage && (
            <p className={`text-sm ${nameMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
              {nameMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={nameSaving || nameValue.trim() === (name ?? "")}
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {nameSaving ? "저장 중…" : "저장"}
          </button>
        </form>
      </section>

      {/* 회원탈퇴 */}
      <section className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-slate-900">
        <h2 className="mb-1 text-sm font-semibold text-red-500 uppercase tracking-wide">위험 구역</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          계정을 삭제하면 모든 데이터(업로드 내역, 분석 결과)가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl border border-red-300 px-5 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            회원탈퇴
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              계속하려면 아래 입력란에{" "}
              <strong className="text-red-500">{deleteConfirmPhrase}</strong>
              을 입력하세요.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={deleteConfirmPhrase}
              className="w-full rounded-xl border border-red-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-red-900/50 dark:bg-slate-800 dark:text-slate-100"
            />
            {deleteError && (
              <p className="text-sm text-red-500">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setDeleteError(null); }}
                className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={HandleDeleteAccount}
                disabled={deleteInput !== deleteConfirmPhrase || deleting}
                className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "처리 중…" : "계정 영구 삭제"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
