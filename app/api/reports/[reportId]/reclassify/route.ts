import { CreateClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { AccountType } from "@/types/finance";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { account: string; type: AccountType };
  if (!body.account || !body.type) {
    return NextResponse.json({ error: "account and type required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("finance_rows")
    .update({ type: body.type })
    .eq("report_id", reportId)
    .eq("user_id", user.id)
    .eq("account", body.account);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
