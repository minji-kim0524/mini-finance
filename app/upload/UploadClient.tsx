"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { PLSummary } from "@/types/finance";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { FormatKRW } from "@/lib/format";

type UploadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; reportId: string; summary: PLSummary }
  | { status: "error"; message: string }
  | { status: "limit" };

const summaryLabels: { key: keyof PLSummary; label: string }[] = [
  { key: "totalRevenue",    label: "총 매출" },
  { key: "totalCogs",       label: "매출원가" },
  { key: "grossProfit",     label: "매출총이익" },
  { key: "totalExpense",    label: "판관비" },
  { key: "operatingProfit", label: "영업이익" },
];

interface UploadClientProps {
  userName: string | null;
  userEmail: string;
  plan: string;
  hasCustomerId: boolean;
}

export default function UploadClient({ userName, userEmail, plan, hasCustomerId }: UploadClientProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState]     = useState<UploadState>({ status: "idle" });

  function HandleFile(f: File) { setFile(f); setState({ status: "idle" }); }
  function HandleDrop(e: React.DragEvent) { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) HandleFile(f); }

  async function HandleUpload() {
    if (!file) return;
    setState({ status: "loading" });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res  = await fetch("/api/parse", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "FREE_LIMIT") { setState({ status: "limit" }); return; }
        setState({ status: "error", message: json.error ?? "업로드 실패" });
        return;
      }
      setState({ status: "success", reportId: json.reportId, summary: json.summary });
    } catch {
      setState({ status: "error", message: "네트워크 오류가 발생했습니다." });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">재무 데이터 업로드</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              엑셀 파일(.xlsx, .xls)을 업로드하면 손익을 자동으로 분석합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
              대시보드
            </Link>
            <ThemeToggle />
            <UserMenu name={userName} email={userEmail} plan={plan} hasCustomerId={hasCustomerId} />
          </div>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={HandleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-14 transition ${
            dragging
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
          }`}
        >
          <UploadIcon />
          {file ? (
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{file.name}</p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              파일을 드래그하거나 <span className="font-semibold text-blue-600 dark:text-blue-400">클릭해서 선택</span>하세요
            </p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500">.xlsx, .xls 지원</p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) HandleFile(f); }} />
        </div>

        <button
          type="button"
          onClick={HandleUpload}
          disabled={!file || state.status === "loading"}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.status === "loading" ? "분석 중…" : "업로드 및 분석"}
        </button>

        <FormatGuide />

        {state.status === "limit" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 space-y-3 dark:border-amber-900/50 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">무료 플랜 리포트 한도 도달</p>
            <p className="text-sm text-amber-700 dark:text-amber-400">무료 플랜은 리포트를 3개까지 저장할 수 있습니다. Pro로 업그레이드하면 무제한으로 저장할 수 있어요.</p>
            <Link href="/pricing" className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
              Pro 업그레이드하기
            </Link>
          </div>
        )}

        {state.status === "error" && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {state.message}
          </p>
        )}

        {state.status === "success" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-200">분석 완료</h2>
              <dl className="space-y-2">
                {summaryLabels.map(({ key, label }) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className={`font-semibold ${state.summary[key] < 0 ? "text-red-500" : "text-slate-900 dark:text-slate-100"}`}>
                      {FormatKRW(state.summary[key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <Link
              href={`/dashboard/${state.reportId}`}
              className="block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              상세 대시보드 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function DownloadSample() {
  const data = [
    ["날짜", "계정과목", "금액"],
    ["2024-01-05", "상품매출", 8000000],
    ["2024-01-10", "매출원가", 3500000],
    ["2024-01-15", "급여", 2000000],
    ["2024-01-20", "광고선전비", 500000],
    ["2024-01-25", "임차료", 800000],
    ["2024-02-05", "상품매출", 9500000],
    ["2024-02-10", "매출원가", 4000000],
    ["2024-02-15", "급여", 2000000],
    ["2024-02-20", "복리후생비", 300000],
    ["2024-02-28", "통신비", 150000],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 14 }, { wch: 18 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "거래내역");
  XLSX.writeFile(wb, "거래내역_샘플.xlsx");
}

const sampleRows = [
  { date: "2024-01-05", account: "상품매출",  amount: "8,000,000" },
  { date: "2024-01-10", account: "매출원가",  amount: "3,500,000" },
  { date: "2024-01-15", account: "급여",      amount: "2,000,000" },
  { date: "2024-01-20", account: "광고선전비", amount: "500,000" },
  { date: "...",        account: "...",       amount: "..." },
];

function FormatGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between px-5 py-4">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-left">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">업로드 형식 가이드</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-400 transition-transform dark:text-slate-500 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        <button type="button" onClick={DownloadSample} className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          예시 파일 다운로드
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4 dark:border-slate-800">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">필수 컬럼 (헤더명 정확히 입력)</p>
            <div className="flex flex-wrap gap-2">
              {[
                { col: "날짜",    desc: "YYYY-MM-DD 형식" },
                { col: "계정과목", desc: "거래 항목명" },
                { col: "금액",    desc: "숫자 (원 단위)" },
              ].map(({ col, desc }) => (
                <div key={col} className="rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700">
                  <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{col}</span>
                  <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">예시</p>
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-400">날짜</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-400">계정과목</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600 dark:text-slate-400">금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {sampleRows.map((row, i) => (
                    <tr key={i} className="text-slate-500 dark:text-slate-400">
                      <td className="px-3 py-1.5">{row.date}</td>
                      <td className="px-3 py-1.5">{row.account}</td>
                      <td className="px-3 py-1.5 text-right">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">계정과목 자동 분류 예시</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "매출 → 매출액",              color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
                { label: "매출원가 → 매출원가",          color: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
                { label: "급여/광고비/임차료 → 판관비",   color: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
                { label: "현금/보통예금 → 자산",         color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
              ].map(({ label, color }) => (
                <span key={label} className={`rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  );
}
