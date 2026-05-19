import { CreateClient } from "@/lib/supabase/server";
import { GetSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// 이름 변경
export async function PATCH(req: Request) {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// 회원탈퇴
export async function DELETE() {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = GetSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
