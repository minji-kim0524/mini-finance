"use client";

import { useState } from "react";
import Link from "next/link";
import type { Report } from "@/types/finance";
import { formatKRW, formatDate } from "@/lib/format";
import { ExcelIcon, ChevronRightIcon, TrashIcon } from "@/app/utils/Icons";
import { PlanBadge, UpgradeBanner } from "@/app/utils/ReportCards";

export default function DashboardClient({ initialReports, plan }: { initialReports: Report[]; plan: string }) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === reports.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reports.map((r) => r.id)));
    }
  }

  async function handleDeleteSelected() {
    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/reports/${id}`, { method: "DELETE" })
        )
      );
      setReports((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
      setConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  const isPro = plan === "pro";
  const atLimit = !isPro && reports.length >= 3;

  if (reports.length === 0) {
    return (
      <div className="space-y-3">
        {!isPro && <PlanBadge count={0} />}
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">아직 업로드한 내역이 없습니다.</p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">엑셀 파일을 업로드하면 여기에 표시됩니다.</p>
          <Link
            href="/dashboard/upload"
            className="mt-6 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            첫 파일 업로드하기
          </Link>
        </div>
      </div>
    );
  }

  const allSelected = selected.size === reports.length;
  const someSelected = selected.size > 0;

  return (
    <div className="space-y-3">
      {!isPro && <PlanBadge count={reports.length} />}
      {atLimit && <UpgradeBanner />}

      <div className="flex items-center justify-between px-1">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600 dark:border-slate-600"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {someSelected ? `${selected.size}개 선택됨` : "전체 선택"}
          </span>
        </label>

        {someSelected && (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <TrashIcon />
            {selected.size}개 삭제
          </button>
        )}
      </div>

      {confirm && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">
            선택한 <span className="font-semibold">{selected.size}개</span> 내역을 삭제할까요?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? "삭제 중…" : "삭제"}
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {reports.map((report) => {
          const isSelected = selected.has(report.id);
          return (
            <li key={report.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(report.id)}
                className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-blue-600 dark:border-slate-600"
              />
              <Link
                href={`/dashboard/${report.id}`}
                className={`flex flex-1 items-center gap-4 rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
                  isSelected
                    ? "border-blue-300 ring-1 ring-blue-200 dark:border-blue-700 dark:ring-blue-800"
                    : "border-slate-200 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-700"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/30">
                  <ExcelIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{report.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(report.created_at)} · {report.row_count}건
                  </p>
                  <div className="mt-2.5 flex gap-5">
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">매출</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatKRW(report.total_revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 dark:text-slate-500">영업이익</p>
                      <p className={`text-sm font-semibold ${report.operating_profit < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                        {formatKRW(report.operating_profit)}
                      </p>
                    </div>
                  </div>
                </div>
                <ChevronRightIcon />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

