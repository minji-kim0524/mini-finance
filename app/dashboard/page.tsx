import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-gray-500">{user.email}</p>
      {/* Phase 2에서 업로드 UI 추가 */}
    </div>
  );
}
