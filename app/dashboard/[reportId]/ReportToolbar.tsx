import { ExcelExportIcon, PrintIcon } from "@/app/utils/Icons";

export type Tab = "dashboard" | "income" | "balance" | "mfg_cost" | "classify";

interface ReportToolbarProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  hasBalanceSheet: boolean;
  hasMfgCost: boolean;
  otherCount: number;
  isStatementTab: boolean;
  onPrint: () => void;
  onExcelExport: () => void;
}

export default function ReportToolbar({
  tab,
  onTabChange,
  hasBalanceSheet,
  hasMfgCost,
  otherCount,
  isStatementTab,
  onPrint,
  onExcelExport,
}: ReportToolbarProps) {
  const tabs: { value: Tab; label: string; disabled?: boolean }[] = [
    { value: "dashboard", label: "대시보드" },
    { value: "income",    label: "손익계산서" },
    { value: "balance",   label: "재무상태표",    disabled: !hasBalanceSheet },
    { value: "mfg_cost",  label: "제조원가명세서", disabled: !hasMfgCost },
    { value: "classify",  label: "계정 분류" },
  ];

  return (
    <div className="flex items-center gap-2">
      <nav aria-label="리포트 보기 전환" role="tablist" className="flex flex-1 rounded-2xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => !t.disabled && onTabChange(t.value)}
            disabled={t.disabled}
            className={`relative flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              tab === t.value
                ? "bg-white text-slate-900 shadow-sm"
                : t.disabled
                ? "cursor-not-allowed text-slate-300"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.value === "classify" && otherCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
                {otherCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {isStatementTab && (
        <>
          <button
            type="button"
            onClick={onPrint}
            className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <PrintIcon />
            PDF
          </button>
          <button
            type="button"
            onClick={onExcelExport}
            className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
          >
            <ExcelExportIcon />
            Excel
          </button>
        </>
      )}
    </div>
  );
}