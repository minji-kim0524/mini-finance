"use client";

import { useState } from "react";
import Link from "next/link";

interface Report {
  id: string;
  name: string;
  row_count: number;
  total_revenue: number;
  gross_profit: number;
  operating_profit: number;
  created_at: string;
}

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardClient({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-500">아직 업로드한 내역이 없습니다.</p>
        <p className="mt-1 text-sm text-slate-400">엑셀 파일을 업로드하면 여기에 표시됩니다.</p>
        <Link
          href="/upload"
          className="mt-6 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          첫 파일 업로드하기
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.id}>
          {confirmId === report.id ? (
            // 삭제 확인 상태
            <div className="flex items-center justify-between rounded-3xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm font-medium text-red-700">
                <span className="font-semibold">"{report.name}"</span>을 삭제할까요?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(report.id)}
                  disabled={deletingId === report.id}
                  className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {deletingId === report.id ? "삭제 중…" : "삭제"}
                </button>
              </div>
            </div>
          ) : (
            // 일반 상태
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/${report.id}`}
                className="flex flex-1 items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                  <ExcelIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{report.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDate(report.created_at)} · {report.row_count}건
                  </p>
                  <div className="mt-2.5 flex gap-5">
                    <div>
                      <p className="text-xs text-slate-400">매출</p>
                      <p className="text-sm font-semibold text-slate-700">{formatKRW(report.total_revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">영업이익</p>
                      <p className={`text-sm font-semibold ${report.operating_profit < 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {formatKRW(report.operating_profit)}
                      </p>
                    </div>
                  </div>
                </div>
                <ChevronRightIcon />
              </Link>
              <button
                type="button"
                onClick={() => setConfirmId(report.id)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-300 transition hover:bg-red-50 hover:text-red-400"
                aria-label="삭제"
              >
                <TrashIcon />
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function ExcelIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
