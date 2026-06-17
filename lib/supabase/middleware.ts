import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SERVER_INSTANCE_ID } from "@/lib/serverInstance";

const INSTANCE_COOKIE = "server_instance";

export async function UpdateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth/");
  const isApiRoute = pathname.startsWith("/api/");

  // 서버 재시작 감지 (개발 환경 전용)
  // 배포(Vercel 서버리스)에서는 요청마다 인스턴스가 달라 이 체크를 사용할 수 없음
  if (process.env.NODE_ENV === "development" && !isAuthRoute && !isApiRoute) {
    const instanceCookie = request.cookies.get(INSTANCE_COOKIE)?.value;
    if (instanceCookie !== SERVER_INSTANCE_ID) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      const response = NextResponse.redirect(url);
      // Supabase 세션 쿠키 삭제
      request.cookies.getAll().forEach(({ name }) => {
        if (name.startsWith("sb-")) response.cookies.delete(name);
      });
      response.cookies.set(INSTANCE_COOKIE, SERVER_INSTANCE_ID, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }
  }

  const supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  // getSession(): 쿠키만 읽는 낙관적 체크 (네트워크 요청 없음)
  // Next.js Proxy 공식 권장 방식 — getUser()는 Supabase API 호출로 느리고
  // Vercel 서버리스 환경에서 응답 지연 시 null을 리턴해 강제 로그아웃 발생
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 루트 경로 → 쿠키 기반 세션 체크로 리다이렉트 (네트워크 요청 없음)
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = session ? "/dashboard" : "/auth/login";
    return NextResponse.redirect(url);
  }

  // 비로그인 → 로그인 페이지로 리다이렉트
  if (!session && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 인스턴스 쿠키 갱신 (개발 환경 전용)
  if (process.env.NODE_ENV === "development") {
    supabaseResponse.cookies.set(INSTANCE_COOKIE, SERVER_INSTANCE_ID, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return supabaseResponse;
}
