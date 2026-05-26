"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateClient } from "@/lib/supabase/client";

interface Props {
  name: string | null;
  email: string;
  emailVerified: boolean;
  plan: string;
  accountType: "personal" | "business";
  birthDate: string | null;
  businessNumber: string | null;
  hasBoth: boolean;
}

export default function ProfileClient({ name, email, emailVerified, plan, accountType, birthDate, businessNumber, hasBoth }: Props) {
  const [nameValue, setNameValue] = useState(name ?? "");
  const [nameEditing, setNameEditing] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activeType, setActiveType] = useState<"personal" | "business">(accountType);
  const [typeError, setTypeError] = useState<string | null>(null);

  const [birthDateValue, setBirthDateValue] = useState(birthDate ?? "");
  const [birthDateEditing, setBirthDateEditing] = useState(false);
  const [birthDateSaving, setBirthDateSaving] = useState(false);
  const [birthDateMessage, setBirthDateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = CreateClient();

  async function HandleTypeSwitch(type: "personal" | "business") {
    if (!hasBoth || type === activeType) return;
    const prev = activeType;
    setActiveType(type);
    setTypeError(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_type: type }),
      });
      if (!res.ok) {
        setActiveType(prev);
        setTypeError("계정 유형 변경에 실패했습니다.");
      }
    } catch {
      setActiveType(prev);
      setTypeError("네트워크 오류가 발생했습니다.");
    }
  }

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
        setNameEditing(false);
        router.refresh();
      }
    } catch {
      setNameMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setNameSaving(false);
    }
  }

  async function HandleBirthDateSave(e: React.FormEvent) {
    e.preventDefault();
    setBirthDateSaving(true);
    setBirthDateMessage(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birth_date: birthDateValue || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBirthDateMessage({ type: "error", text: json.error ?? "저장 실패" });
      } else {
        setBirthDateMessage({ type: "success", text: "생년월일이 저장되었습니다." });
        setBirthDateEditing(false);
        router.refresh();
      }
    } catch {
      setBirthDateMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setBirthDateSaving(false);
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
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">계정 유형</p>
            <div className="mt-1.5 flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
              {(["personal", "business"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => HandleTypeSwitch(type)}
                  disabled={!hasBoth}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                    activeType === type
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                      : hasBoth
                        ? "cursor-pointer text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        : "cursor-not-allowed text-slate-300 dark:text-slate-600"
                  }`}
                >
                  {type === "personal" ? "개인" : "사업자"}
                </button>
              ))}
            </div>
            {typeError && <p className="mt-1 text-xs text-red-500">{typeError}</p>}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">이름</p>
            {nameEditing ? (
              <form onSubmit={HandleNameSave} className="mt-1.5 space-y-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
                />
                {nameMessage && (
                  <p className={`text-xs ${nameMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                    {nameMessage.text}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={nameSaving || nameValue.trim() === (name ?? "")}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {nameSaving ? "저장 중…" : "저장"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNameEditing(false); setNameValue(name ?? ""); setNameMessage(null); }}
                    className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <p className={`text-sm font-medium ${nameValue ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}>
                  {nameValue || "(입력값없음)"}
                </p>
                <button
                  type="button"
                  onClick={() => { setNameEditing(true); setNameMessage(null); }}
                  className="cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium text-blue-500 transition hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  편집
                </button>
              </div>
            )}
          </div>
          {activeType === "personal" && (
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">생년월일</p>
              {birthDateEditing ? (
                <form onSubmit={HandleBirthDateSave} className="mt-1.5 space-y-2">
                  <input
                    type="date"
                    value={birthDateValue}
                    onChange={(e) => setBirthDateValue(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
                  />
                  {birthDateMessage && (
                    <p className={`text-xs ${birthDateMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                      {birthDateMessage.text}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={birthDateSaving}
                      className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {birthDateSaving ? "저장 중…" : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setBirthDateEditing(false); setBirthDateValue(birthDate ?? ""); setBirthDateMessage(null); }}
                      className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <p className={`text-sm font-medium ${birthDateValue ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}>
                    {birthDateValue || "(입력값없음)"}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setBirthDateEditing(true); setBirthDateMessage(null); }}
                    className="cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium text-blue-500 transition hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    편집
                  </button>
                </div>
              )}
            </div>
          )}
          {activeType === "business" && (
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">사업자등록번호</p>
              <p className={`mt-1 text-sm font-medium ${businessNumber ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}>
                {businessNumber || "(입력값없음)"}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">이메일</p>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{email}</p>
              {emailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <circle cx="6" cy="6" r="6" className="fill-green-500 dark:fill-green-500" />
                    <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  인증완료
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">요금제</p>
            <p className="mt-1">
              {plan === "pro" ? (
                <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">Pro</span>
              ) : (
                <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">무료</span>
              )}
            </p>
          </div>
        </div>
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
