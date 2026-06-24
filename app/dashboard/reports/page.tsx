import { CreateClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "../DashboardClient";

export default async function ReportsPage() {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: reports }, { data: sub }] = await Promise.all([
    supabase
      .from("reports")
      .select("id, name, row_count, total_revenue, gross_profit, operating_profit, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single(),
  ]);

  const plan = sub?.plan ?? "free";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">내역 관리</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          업로드한 엑셀 파일 목록입니다. 파일을 클릭하면 손익계산서·재무상태표·제조원가명세서를 확인하고 PDF 인쇄 및 Excel 다운로드를 할 수 있습니다.
        </p>
      </div>
      <DashboardClient initialReports={reports ?? []} plan={plan} />
    </div>
  );
}
