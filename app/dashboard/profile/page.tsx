import { CreateClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const metadata = user.user_metadata ?? {};
  const hasBoth = "birth_date" in metadata && "business_number" in metadata;

  return (
    <ProfileClient
      name={metadata.name ?? null}
      email={user.email ?? ""}
      emailVerified={!!user.email_confirmed_at}
      plan={sub?.plan ?? "free"}
      accountType={metadata.account_type ?? "personal"}
      birthDate={metadata.birth_date ?? null}
      businessNumber={metadata.business_number ?? null}
      hasBoth={hasBoth}
    />
  );
}
