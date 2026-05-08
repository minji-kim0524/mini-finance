import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserMenu from "@/components/UserMenu";

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

        {reports && reports.length > 0 ? (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/dashboard/${report.id}`}
                  className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
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
                        <p className="text-sm font-semibold text-slate-700">
                          {formatKRW(report.total_revenue)}
                        </p>
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
              </li>
            ))}
          </ul>
        ) : (
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
        )}
      </div>
    </div>
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
