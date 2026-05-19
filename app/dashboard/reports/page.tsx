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
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">내역 관리</h1>
      <DashboardClient initialReports={reports ?? []} plan={plan} />
    </div>
  );
}
