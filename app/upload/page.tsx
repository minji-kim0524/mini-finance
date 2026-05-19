import { CreateClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UploadClient from "./UploadClient";

export default async function UploadPage() {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  const plan = sub?.plan ?? "free";

  return (
    <UploadClient
      userName={user.user_metadata?.name ?? null}
      userEmail={user.email ?? ""}
      plan={plan}
      hasCustomerId={!!sub?.stripe_customer_id}
    />
  );
}
