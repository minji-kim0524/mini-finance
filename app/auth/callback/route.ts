import { NextResponse } from "next/server";
import { CreateClient } from "@/lib/supabase/server";
import { GetSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await CreateClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // 여기서 에러 내용을 확인하여 원인 파악
      console.error("[auth/callback] 세션 교환 실패:", error.message, error);
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 이메일 계정이 있는데 소셜 로그인으로 접근한 경우 안내 메세지 표시
      const emailIdentity = user.identities?.find((id) => id.provider === "email");
      const socialIdentity = user.identities?.find(
        (id) => id.provider === "kakao" || id.provider === "google"
      );

      if (emailIdentity && socialIdentity) {
        return NextResponse.redirect(
          `${origin}/auth/login?error=${encodeURIComponent("이미 가입된 계정이 있습니다.")}&signout=1`
        );
      }

      const name =
        user.user_metadata?.name ??       // 카카오: profile_nickname
        user.user_metadata?.full_name ??  // 구글: full_name
        user.email?.split("@")[0] ??
        "소셜 유저";

      // admin 클라이언트로 RLS 우회하여 저장 (신규 유저만, 기존 유저는 무시)
      const admin = GetSupabaseAdmin();
      const { error: profileError } = await admin.from("profiles").upsert(
        {
          id: user.id,
          name,
          account_type: "personal",
          birth_date: null,
          business_number: null,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

      if (profileError) {
        console.error("[auth/callback] profiles 저장 실패:", profileError.message);
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/auth/login`);
}
