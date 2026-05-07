import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 이미 로그인한 사용자 → 대시보드로
  if (user) redirect("/dashboard");

  // 비로그인 사용자 → 로그인 페이지로
  redirect("/auth/login");
}
