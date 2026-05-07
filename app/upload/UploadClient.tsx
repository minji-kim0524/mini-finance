"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { FinanceRow, PLSummary } from "@/types/finance";

type UploadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; rows: FinanceRow[]; summary: PLSummary }
  | { status: "error"; message: string };

const SUMMARY_LABELS: { key: keyof PLSummary; label: string }[] = [
  { key: "totalRevenue", label: "총 매출" },
  { key: "totalCogs", label: "매출원가" },
  { key: "grossProfit", label: "매출총이익" },
  { key: "totalExpense", label: "판관비" },
  { key: "operatingProfit", label: "영업이익" },
];

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export default function UploadClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  function handleFile(f: File) {
    setFile(f);
    setState({ status: "idle" });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setState({ status: "loading" });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: json.error ?? "업로드 실패" });
        return;
      }

      setState({ status: "success", rows: json.rows, summary: json.summary });
    } catch {
      setState({ status: "error", message: "네트워크 오류가 발생했습니다." });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">재무 데이터 업로드</h1>
          <p className="mt-1 text-sm text-slate-500">
            엑셀 파일(.xlsx, .xls)을 업로드하면 손익을 자동으로 분석합니다.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-14 transition ${
            dragging
              ? "border-blue-400 bg-blue-50"
              : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          <UploadIcon />
          {file ? (
            <p className="text-sm font-medium text-slate-700">{file.name}</p>
          ) : (
            <p className="text-sm text-slate-500">
              파일을 드래그하거나 <span className="font-semibold text-blue-600">클릭해서 선택</span>하세요
            </p>
          )}
          <p className="text-xs text-slate-400">.xlsx, .xls 지원</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Upload button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || state.status === "loading"}
          className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.status === "loading" ? "분석 중…" : "업로드 및 분석"}
        </button>

        {/* Error */}
        {state.status === "error" && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {state.message}
          </p>
        )}

        {/* Success */}
        {state.status === "success" && (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-slate-800">
                손익 요약{" "}
                <span className="text-sm font-normal text-slate-400">
                  ({state.rows.length}건)
                </span>
              </h2>
              <dl className="space-y-2">
                {SUMMARY_LABELS.map(({ key, label }) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-slate-500">{label}</dt>
                    <dd
                      className={`font-semibold ${
                        state.summary[key] < 0 ? "text-red-500" : "text-slate-900"
                      }`}
                    >
                      {formatKRW(state.summary[key])}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <Link
              href="/dashboard"
              className="block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              대시보드에서 전체 내역 확인
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-10 w-10 text-slate-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}
