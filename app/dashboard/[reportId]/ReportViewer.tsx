"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams } from "next/navigation";
import type { FinanceRow, AccountType } from "@/types/finance";
import { ExportIncomeStatement, ExportBalanceSheet, ExportMfgCostStatement } from "@/lib/reportExcelExport";
import ReportToolbar, { type Tab } from "./ReportToolbar";
import CompareSelector from "./CompareSelector";
import DashboardView from "./DashboardView";
import IncomeStatementView from "./IncomeStatementView";
import BalanceSheetView from "./BalanceSheetView";
import MfgCostView from "./MfgCostView";
import ClassifyView from "./ClassifyView";

interface ReportViewerProps {
  rows: FinanceRow[];
  reportName: string;
  otherReports?: { id: string; name: string; created_at: string }[];
}

export default function ReportViewer({ rows: initialRows, reportName, otherReports = [] }: ReportViewerProps) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [rows, setRows] = useState<FinanceRow[]>(initialRows);
  const [compareId, setCompareId] = useState<string>("");
  const [compareRows, setCompareRows] = useState<FinanceRow[] | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const params = useParams<{ reportId: string }>();

  const hasBalanceSheet = useMemo(
    () => rows.some(r => r.type === "asset" || r.type === "liability" || r.type === "equity"),
    [rows]
  );

  const hasMfgCost = useMemo(() => rows.some(r => r.type === "mfg_cost"), [rows]);

  const otherCount = useMemo(() => {
    const seen = new Set<string>();
    return rows.filter(r => { if (r.type === "other" && !seen.has(r.account)) { seen.add(r.account); return true; } return false; }).length;
  }, [rows]);

  const HandleReclassify = useCallback(async (account: string, newType: AccountType) => {
    // 낙관적 업데이트: 즉시 UI 반영
    let prevType: AccountType | null = null;
    setRows(prev => {
      const found = prev.find(r => r.account === account);
      if (found) prevType = found.type;
      return prev.map(r => r.account === account ? { ...r, type: newType } : r);
    });

    const res = await fetch(`/api/reports/${params.reportId}/reclassify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, type: newType }),
    });

    if (!res.ok) {
      // 실패 시 롤백
      if (prevType !== null) {
        setRows(prev => prev.map(r => r.account === account ? { ...r, type: prevType! } : r));
      }
      throw new Error("저장 실패");
    }
  }, [params.reportId]);

  const HandleCompareChange = useCallback(async (id: string) => {
    setCompareId(id);
    if (!id) { setCompareRows(null); return; }
    setCompareLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}/rows`);
      const json = await res.json() as { rows: FinanceRow[] };
      setCompareRows(json.rows);
    } finally {
      setCompareLoading(false);
    }
  }, []);

  const HandlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: reportName,
    pageStyle: `
      @page { size: A4 portrait; margin: 20mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  async function HandleExcelExport() {
    const name = reportName.replace(/\.(xlsx|xls)$/i, "");
    if (tab === "income")   await ExportIncomeStatement(rows, name);
    if (tab === "balance")  await ExportBalanceSheet(rows, name);
    if (tab === "mfg_cost") await ExportMfgCostStatement(rows, name);
  }

  const isStatementTab = tab === "income" || tab === "balance" || tab === "mfg_cost";

  return (
    <div className="space-y-4">
      <ReportToolbar
        tab={tab}
        onTabChange={setTab}
        hasBalanceSheet={hasBalanceSheet}
        hasMfgCost={hasMfgCost}
        otherCount={otherCount}
        isStatementTab={isStatementTab}
        onPrint={() => HandlePrint()}
        onExcelExport={HandleExcelExport}
      />

      {isStatementTab && otherReports.length > 0 && (
        <CompareSelector
          reports={otherReports}
          value={compareId}
          onChange={HandleCompareChange}
          loading={compareLoading}
        />
      )}

      {tab === "dashboard" && <DashboardView rows={rows} />}

      <div ref={printRef} role="region" aria-label="재무제표">
        {tab === "income"   && <IncomeStatementView rows={rows} compareRows={compareRows ?? undefined} />}
        {tab === "balance"  && <BalanceSheetView rows={rows} compareRows={compareRows ?? undefined} />}
        {tab === "mfg_cost" && <MfgCostView rows={rows} compareRows={compareRows ?? undefined} />}
      </div>

      {tab === "classify" && <ClassifyView rows={rows} onReclassify={HandleReclassify} />}
    </div>
  );
}