import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  const plan = sub?.plan ?? "free";
  const customerId = sub?.stripe_customer_id ?? null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar plan={plan} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 상단 헤더 */}
        <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
          <Link
            href="/dashboard/upload"
            className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            파일 업로드
          </Link>
          <ThemeToggle />
          <UserMenu
            name={user.user_metadata?.name ?? null}
            email={user.email ?? ""}
            plan={plan}
            hasCustomerId={!!customerId}
          />
        </header>
        <main className="flex-1 overflow-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
