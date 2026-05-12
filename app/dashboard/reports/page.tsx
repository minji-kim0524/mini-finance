import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import DashboardClient from "../DashboardClient";

export default async function ReportsPage() {
  const supabase = await createClient();
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
      .select("plan, stripe_customer_id")
      .eq("user_id", user.id)
      .single(),
  ]);

  const plan = sub?.plan ?? "free";
  const customerId = sub?.stripe_customer_id ?? null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">대시보드</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              파일 업로드
            </Link>
            <UserMenu
              name={user.user_metadata?.name ?? null}
              email={user.email ?? ""}
              plan={plan}
              hasCustomerId={!!customerId}
            />
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <Link
            href="/dashboard"
            className="flex-1 rounded-xl py-2 text-center text-sm font-semibold text-slate-500 transition hover:text-slate-700"
          >
            대시보드
          </Link>
          <span className="flex-1 rounded-xl bg-slate-900 py-2 text-center text-sm font-semibold text-white">
            내역 관리
          </span>
        </div>

        <DashboardClient initialReports={reports ?? []} plan={plan} />
      </div>
    </div>
  );
}
