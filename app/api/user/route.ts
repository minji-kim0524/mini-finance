import { CreateClient } from "@/lib/supabase/server";
import { GetSupabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// 이름/생년월일 변경
export async function PATCH(req: Request) {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if ("name" in body) {
    const { name } = body;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }
    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if ("birth_date" in body) {
    const { birth_date } = body;
    if (birth_date !== null && (typeof birth_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(birth_date))) {
      return NextResponse.json({ error: "올바른 날짜 형식이 아닙니다." }, { status: 400 });
    }
    const { error } = await supabase.auth.updateUser({ data: { birth_date: birth_date ?? null } });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "변경할 항목이 없습니다." }, { status: 400 });
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
