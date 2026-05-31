"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateClient } from "@/lib/supabase/client";
import DateWheelPicker from "./DateWheelPicker";

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

function CheckDot({ filled }: { filled: boolean }) {
  return filled ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#22c55e" />
      <path d="M6 10l2.5 2.5 5.5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="#d1d5db" strokeWidth="1.5" />
      <path d="M6 10l2.5 2.5 5.5-5" stroke="#d1d5db" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProfileClient({ name, email, emailVerified, plan, accountType, birthDate, businessNumber, hasBoth }: Props) {
  const [nameValue, setNameValue] = useState(name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activeType, setActiveType] = useState<"personal" | "business">(accountType);
  const [typeError, setTypeError] = useState<string | null>(null);

  const [birthDateValue, setBirthDateValue] = useState(birthDate ?? "");
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
        router.refresh();
      }
    } catch {
      setNameMessage({ type: "error", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setNameSaving(false);
    }
  }

  async function HandleBirthDateSave() {
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
    <div className="mx-auto max-w-lg space-y-8 px-2 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">프로필 설정</h1>

      {/* 프로필 아바타 */}
      <div className="flex justify-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="18" r="9" fill="#9ca3af" />
              <path d="M8 44c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="#9ca3af" />
            </svg>
          </div>
          <button
            type="button"
            aria-label="프로필 사진 변경"
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gray-400 transition hover:bg-gray-500 dark:bg-gray-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="4" stroke="white" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* 계정 유형 */}
      <div className="space-y-2">
        <span className="text-base font-bold text-gray-900 dark:text-gray-100">계정 유형</span>
        <div className="flex overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
          {(["personal", "business"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => HandleTypeSwitch(type)}
              disabled={!hasBoth}
              className={`flex-1 py-3 text-sm font-semibold transition ${
                activeType === type
                  ? "rounded-xl border border-green-500 bg-white text-green-500 dark:bg-gray-900"
                  : hasBoth
                    ? "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    : "cursor-not-allowed text-gray-300 dark:text-gray-600"
              }`}
            >
              {type === "personal" ? "개인" : "사업자"}
            </button>
          ))}
        </div>
        {typeError && <p className="text-sm text-red-500">{typeError}</p>}
      </div>

      {/* 이름 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">이름</span>
            <CheckDot filled={!!nameValue.trim()} />
          </div>
          {nameMessage && (
            <span className={`text-sm font-medium ${nameMessage.type === "success" ? "text-green-500" : "text-red-500"}`}>
              {nameMessage.text}
            </span>
          )}
        </div>
        <form
          onSubmit={HandleNameSave}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
        >
          <input
            type="text"
            value={nameValue}
            onChange={(e) => { setNameValue(e.target.value); setNameMessage(null); }}
            placeholder="이름을 입력하세요"
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={nameSaving || nameValue.trim() === (name ?? "")}
            className="rounded-lg bg-green-500 px-3 py-1 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
          >
            {nameSaving ? "저장 중…" : "저장"}
          </button>
        </form>
      </div>

      {/* 생년월일 (개인) */}
      {activeType === "personal" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">생년월일</span>
              <CheckDot filled={!!birthDateValue} />
            </div>
            {birthDateMessage && (
              <span className={`text-sm font-medium ${birthDateMessage.type === "success" ? "text-green-500" : "text-red-500"}`}>
                {birthDateMessage.text}
              </span>
            )}
          </div>
          <DateWheelPicker
            value={birthDateValue}
            onChange={(v) => { setBirthDateValue(v); setBirthDateMessage(null); }}
          />
          <button
            type="button"
            onClick={HandleBirthDateSave}
            disabled={birthDateSaving || birthDateValue === (birthDate ?? "")}
            className="w-full rounded-xl bg-green-500 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
          >
            {birthDateSaving ? "저장 중…" : "저장"}
          </button>
        </div>
      )}

      {/* 사업자등록번호 (사업자) */}
      {activeType === "business" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">사업자등록번호</span>
            <CheckDot filled={!!businessNumber} />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
            <span className={`text-sm ${businessNumber ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
              {businessNumber ?? "(입력값없음)"}
            </span>
          </div>
        </div>
      )}

      {/* 이메일 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">이메일</span>
          <CheckDot filled={!!email} />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{email}</span>
          {emailVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="6" fill="#22c55e" />
                <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              인증완료
            </span>
          )}
        </div>
      </div>

      {/* 요금제 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">요금제</span>
          <CheckDot filled={true} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900">
          {plan === "pro" ? (
            <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">Pro</span>
          ) : (
            <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">무료</span>
          )}
        </div>
      </div>

      {/* 세금계산서 (사업자 전용) */}
      {activeType === "business" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">세금계산서</h2>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            유료 요금제 이용 시 해당 월 결제 금액에 대한 세금계산서를 발행할 수 있습니다.
          </p>
          <button
            type="button"
            disabled={plan === "free"}
            className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:disabled:border-gray-700 dark:disabled:text-gray-600"
          >
            세금계산서 발행
          </button>
          {plan === "free" && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">유료 요금제 이용 시 활성화됩니다.</p>
          )}
        </section>
      )}

      {/* 회원탈퇴 */}
      <section className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-gray-900">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-red-500">위험 구역</h2>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
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
            <p className="text-sm text-gray-700 dark:text-gray-300">
              계속하려면 아래 입력란에{" "}
              <strong className="text-red-500">{deleteConfirmPhrase}</strong>
              을 입력하세요.
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={deleteConfirmPhrase}
              className="w-full rounded-xl border border-red-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/20 dark:border-red-900/50 dark:bg-gray-800 dark:text-gray-100"
            />
            {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); setDeleteError(null); }}
                className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
