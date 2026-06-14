import { NextResponse } from "next/server";
import { CreateClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await CreateClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 소셜 로그인(카카오, 구글) 유저 → profiles 테이블에 저장
      // 이미 존재하는 유저(id 충돌)는 무시하고, 신규 유저만 insert
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const name =
          user.user_metadata?.name ??         // 카카오: profile_nickname
          user.user_metadata?.full_name ??    // 구글: full_name
          user.email?.split("@")[0] ??        // 이메일 앞부분 fallback
          "소셜 유저";

        // 이미 profiles가 존재하는 경우(중복 insert)는 에러를 무시
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            name,
            account_type: "personal",   // 소셜 로그인은 개인 계정으로 기본 설정
            birth_date: null,
            business_number: null,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/forgot-password`);
}
