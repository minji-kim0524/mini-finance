import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: reports } = await supabase
    .from("reports")
    .select("id, name, row_count, total_revenue, gross_profit, operating_profit, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">내역 관리</h1>
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
            />
          </div>
        </div>

        <DashboardClient initialReports={reports ?? []} />
      </div>
    </div>
  );
}
