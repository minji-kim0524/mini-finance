import { redirect } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import ContactFooter from "@/components/ContactForm";
import { CreateClient, GetUser, GetSubscription } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getSession()은 쿠키만 읽어 네트워크 없음 → userId를 즉시 확보
  const supabase = await CreateClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/auth/login");

  // auth 서버 검증과 subscription 조회를 병렬 실행
  const [user, sub] = await Promise.all([
    GetUser(),
    GetSubscription(session.user.id),
  ]);
  if (!user) redirect("/auth/login");

  const plan = sub?.plan ?? "free";
  const customerId = sub?.stripe_customer_id ?? null;

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* 전체 너비 상단 헤더 */}
      <header className="sticky top-0 z-10 flex h-14 shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* 좌: 로고 */}
        <div className="flex w-56 shrink-0 items-center border-r border-slate-200 px-5 dark:border-slate-800">
          <Link href="/dashboard" className="text-base font-bold text-slate-900 dark:text-slate-100">
            MINI-Finance
          </Link>
        </div>
        {/* 우: 버튼 영역 */}
        <div className="flex flex-1 items-center justify-end gap-2 px-6">
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
            avatarUrl={(user.user_metadata?.avatar_url ?? "").replace(/^http:\/\//i, "https://").replace("fname=http://", "fname=https://") || null}
          />
        </div>
      </header>

      {/* 본문: 사이드바 + 콘텐츠 */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar plan={plan} />
        <div className="flex flex-1 flex-col overflow-auto">
          <main className="flex-1 px-6 py-8">{children}</main>
          <ContactFooter />
        </div>
      </div>
    </div>
  );
}
