import { redirect } from "next/navigation";
import { CreateClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await CreateClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");
  redirect("/auth/login");
}
