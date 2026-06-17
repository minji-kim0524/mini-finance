# LCP 성능 개선 — Supabase 중복 호출 제거

**날짜:** 2026-06-18  
**커밋:** `42a143b`

---

## 요구 사항

배포 환경 LCP(Largest Contentful Paint) 측정값 **8.56s** → 개선

---

## 원인 분석

### 대시보드 로드 시 Supabase 네트워크 요청 흐름

| 단계 | 파일 | 호출 | 비고 |
|---|---|---|---|
| 1 | `app/page.tsx` | `auth.getUser()` | `/` 접속 시 auth API 호출 후 `/dashboard` 리다이렉트 |
| 2 | `dashboard/layout.tsx` | `auth.getUser()` | 인증 재확인 |
| 3 | `dashboard/layout.tsx` | `subscriptions` 쿼리 | 플랜 조회 |
| 4 | `dashboard/page.tsx` | `auth.getUser()` | 인증 재확인 (중복) |
| 5 | `dashboard/page.tsx` | `subscriptions` 쿼리 | 플랜 조회 (중복) |
| 6 | `dashboard/page.tsx` | `reports` 쿼리 | 리포트 목록 조회 |
| 7 | `dashboard/page.tsx` | `finance_rows` 쿼리 | 최근 리포트 행 데이터 |

**총 7번의 Supabase 호출 중 3번(1·4·5번)이 불필요한 중복.**

Vercel ↔ Supabase 간 왕복 지연이 호출당 100~300ms 발생하므로, 중복 제거로 300~900ms 단축 가능.

---

## 해결 방안

### 1. React `cache()`로 동일 요청 내 중복 제거

React의 `cache()` 함수는 같은 요청(렌더 트리) 안에서 동일 함수를 여러 번 호출해도 네트워크 요청을 1번만 실행한다.

```ts
// lib/supabase/server.ts
import { cache } from "react";

export const GetUser = cache(async () => {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const GetSubscription = cache(async (userId: string) => {
  const supabase = await CreateClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, stripe_customer_id")
    .eq("user_id", userId)
    .single();
  return data;
});
```

`layout.tsx`가 `GetUser()` / `GetSubscription()`을 먼저 호출하면 네트워크 요청이 발생하고, `page.tsx`가 동일 함수를 호출하면 캐시된 Promise를 반환 → 추가 요청 없음.

### 2. 미들웨어에서 루트(`/`) 리다이렉트 처리

기존에는 `app/page.tsx`가 `auth.getUser()`(네트워크)를 호출한 뒤 리다이렉트했다.  
미들웨어는 이미 `getSession()`(쿠키 기반, 네트워크 없음)으로 세션을 확인하므로, 루트 경로 리다이렉트를 미들웨어에서 처리하면 Supabase API 호출 1건을 완전히 제거할 수 있다.

```ts
// lib/supabase/middleware.ts — getSession() 호출 직후에 추가
if (pathname === "/") {
  const url = request.nextUrl.clone();
  url.pathname = session ? "/dashboard" : "/auth/login";
  return NextResponse.redirect(url);
}
```

---

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `lib/supabase/server.ts` | `GetUser`, `GetSubscription` 캐시 헬퍼 추가 |
| `app/dashboard/layout.tsx` | `CreateClient()` 직접 호출 → `GetUser()` / `GetSubscription()` 사용 |
| `app/dashboard/page.tsx` | `GetUser()` / `GetSubscription()` 사용, 중복 subscription 쿼리 제거 |
| `lib/supabase/middleware.ts` | 루트(`/`) 경로 리다이렉트 추가 |

---

## 개선 전후 비교

| | 개선 전 | 개선 후 |
|---|---|---|
| `/` 접속 시 Supabase 호출 | auth.getUser() × 1 | 없음 (쿠키 기반 세션 체크) |
| 대시보드 렌더 시 auth.getUser() | × 2 (layout + page) | × 1 (cache() 공유) |
| 대시보드 렌더 시 subscriptions 쿼리 | × 2 (layout + page) | × 1 (cache() 공유) |
| 총 불필요한 호출 | 3건 | 0건 |

---

## 검증

| 항목 | 결과 |
|---|---|
| TypeScript 컴파일 (`tsc --noEmit`) | ✅ 오류 없음 |
| 프로덕션 빌드 (`next build`) | ✅ 21개 라우트 정상 |
