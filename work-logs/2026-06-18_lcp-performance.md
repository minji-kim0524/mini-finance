# LCP 성능 개선 및 배포 시 로그인 초기화

**날짜:** 2026-06-18  
**커밋:** `42a143b`, `5beff54`, `b99ff43`

---

## 요구 사항

1. 배포 링크 클릭 시 기존 로그인 상태가 유지되는 문제 수정
2. LCP **8.56s** → 목표 **2.5s 이하** (1차 `4.46s`, 2차 `4.82s` 잔존 → 3차 추가 개선)

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

---

## 2차 개선 — auth 검증과 DB 쿼리 병렬 실행 (`5beff54`)

### 남은 문제

1차 적용 후에도 LCP 4.46s 잔존. LCP 요소는 `AnalyticsDashboard` 내부의  
`<p>엑셀 파일을 업로드하면 여기에 표시됩니다.</p>`.

### 원인

`cache()`를 적용했음에도 **순차 대기**가 남아 있었음:

- `layout.tsx`: `await GetUser()` → 완료 후 → `await GetSubscription()` (순차, ~500ms 낭비)
- `page.tsx`: `await GetUser()` → 완료 후 → reports 쿼리 시작 (순차, ~500ms 낭비)

`auth.getUser()`는 Supabase Auth 서버에 검증 요청을 보내는 네트워크 호출이다.  
그 완료를 기다린 뒤에야 subscription / reports 쿼리가 시작되므로, 두 요청이 직렬로 실행된다.

### 해결 — `getSession()`으로 userId 선확보 후 병렬 실행

`getSession()`은 쿠키의 JWT를 파싱해 userId를 반환한다 **(네트워크 없음, 즉시)**.  
이 userId로 DB 쿼리를 먼저 시작하고, `getUser()`(auth 서버 검증)와 병렬로 실행한다.

```ts
// layout.tsx — 병렬 실행 적용
const supabase = await CreateClient();
const { data: { session } } = await supabase.auth.getSession(); // 쿠키만 읽음
if (!session) redirect("/auth/login");

const [user, sub] = await Promise.all([
  GetUser(),                        // auth 서버 검증 (네트워크)
  GetSubscription(session.user.id), // subscription 쿼리 (네트워크) — 동시에 시작
]);
if (!user) redirect("/auth/login");
```

```ts
// page.tsx — 병렬 실행 적용
const supabase = await CreateClient();
const { data: { session } } = await supabase.auth.getSession(); // 쿠키만 읽음
if (!session) redirect("/auth/login");

const [user, { data: reports }] = await Promise.all([
  GetUser(),                                   // auth 서버 검증 (네트워크)
  supabase.from("reports").select(...) ...     // reports 쿼리 (네트워크) — 동시에 시작
]);
if (!user) redirect("/auth/login");

const sub = await GetSubscription(user.id);   // layout이 병렬로 시작한 캐시 결과 즉시 반환
```

### 개선 전후 타임라인

| | 개선 전 (1차 이후) | 개선 후 (2차) |
|---|---|---|
| layout 서버 처리 | auth(500ms) → sub(500ms) = **1000ms 순차** | auth \|\| sub = **~500ms 병렬** |
| page 서버 처리 | auth 캐시 히트 후 reports(500ms) | auth \|\| reports = **~500ms 병렬** |
| layout + page 전체 | ~1500ms | **~500ms** |

---

---

## 3차 개선 — 배포 시 로그인 초기화 + recharts 서버 번들 제외 (`b99ff43`)

### 남은 문제

- 배포 링크 클릭 시 기존 로그인 유지 → 새 배포임에도 대시보드로 바로 진입
- LCP 4.82s 잔존 (2차 재측정) → LCP 요소가 여전히 `AnalyticsDashboard` 내부 텍스트

### 원인 1 — 배포 감지 로직이 프로덕션에서 비활성화

기존 코드는 `SERVER_INSTANCE_ID`로 서버 재시작을 감지해 세션을 초기화했으나, Vercel 서버리스에서는 요청마다 `randomUUID()`가 달라져 항상 세션 초기화가 발생하므로 `NODE_ENV === "development"` 가드로 개발 환경에서만 동작하도록 제한되어 있었다.

**해결**: Vercel이 제공하는 `VERCEL_DEPLOYMENT_ID` 환경변수를 활용. 동일 배포 내에서는 고정값이고, 새 배포 시 값이 바뀐다.

```ts
// lib/serverInstance.ts
export const SERVER_INSTANCE_ID = process.env.VERCEL_DEPLOYMENT_ID ?? randomUUID();
```

미들웨어에서 `NODE_ENV === "development"` 가드를 제거해 프로덕션에서도 동작:
```ts
// 개발/프로덕션 모두: 배포 ID가 다르면 세션 초기화 + 로그인으로 리다이렉트
if (!isAuthRoute && !isApiRoute) {
  if (instanceCookie !== SERVER_INSTANCE_ID) { ... }
}
```

### 원인 2 — recharts가 서버 번들에 포함되어 콜드 스타트 증가

`AnalyticsDashboard`는 `"use client"` 컴포넌트지만, 서버 컴포넌트(`page.tsx`)에서 정적 import되면 SSR 시 recharts 전체가 서버 번들에 포함된다. 이는 Vercel 서버리스 함수의 콜드 스타트를 증가시키고, 클라이언트에서 hydration이 완료되기 전까지 LCP 텍스트 페인트가 지연될 수 있다.

**해결**: `next/dynamic`으로 recharts를 서버 번들에서 완전히 제거.

```tsx
// app/dashboard/DashboardChart.tsx ("use client")
const AnalyticsDashboard = dynamic(() => import("./AnalyticsDashboard"), {
  ssr: false,  // 서버 번들 제외
  loading: () => <div>차트 불러오는 중…</div>,
});
```

(Next.js에서 `ssr: false`는 Server Component에서 직접 사용 불가 → `"use client"` 래퍼 컴포넌트로 분리)

**추가**: 리포트가 없는 경우 빈 상태를 `page.tsx`(서버 컴포넌트)에서 직접 렌더링.  
→ LCP 텍스트가 SSR HTML에 포함되어 JS 로드 없이 즉시 페인트 가능.

```
리포트 없음: page.tsx → 빈 상태 직접 렌더링 (recharts 미포함)
리포트 있음: page.tsx → DashboardChart → AnalyticsDashboard (클라이언트에서 로드)
```

---

## 변경 파일 (전체)

| 파일 | 커밋 | 변경 내용 |
|---|---|---|
| `lib/supabase/server.ts` | `42a143b` | `GetUser`, `GetSubscription` 캐시 헬퍼 추가 |
| `app/dashboard/layout.tsx` | `42a143b`, `5beff54` | 캐시 헬퍼 사용 + auth/subscription 병렬화 |
| `app/dashboard/page.tsx` | `42a143b`, `5beff54`, `b99ff43` | 캐시 헬퍼 + 병렬화 + 빈 상태 서버 렌더링 분리 |
| `lib/supabase/middleware.ts` | `42a143b`, `b99ff43` | 루트 리다이렉트 + 배포 감지 dev 가드 제거 |
| `lib/serverInstance.ts` | `b99ff43` | `VERCEL_DEPLOYMENT_ID` 추가 |
| `app/dashboard/DashboardChart.tsx` | `b99ff43` | `ssr:false` dynamic import 래퍼 (신규) |

---

## 검증

| 항목 | 결과 |
|---|---|
| TypeScript 컴파일 (`tsc --noEmit`) | ✅ 오류 없음 |
| 프로덕션 빌드 (`next build`) | ✅ 21개 라우트 정상 |
