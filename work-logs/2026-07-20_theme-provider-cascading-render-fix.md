# ThemeProvider setState 동기 호출(cascading render) 오류 수정

**날짜:** 2026-07-20

---

## 요구 사항

`ThemeProvider.tsx`에서 발생한 `Calling setState synchronously within an effect can trigger cascading renders` 오류 원인 파악 및 해결.

---

## 변경 파일

- `components/ThemeProvider.tsx`

---

## 원인

마운트 시 실행되는 `useEffect`가 `localStorage`/`matchMedia` 값을 읽어 `setTheme`을 동기 호출.

```ts
// 문제 코드
useEffect(() => {
  const saved = localStorage.getItem("theme") as Theme | null;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial: Theme = saved ?? (prefersDark ? "dark" : "light");
  setTheme(initial); // 동기 setState
  document.documentElement.classList.toggle("dark", initial === "dark");
}, []);
```

Effect는 "React 상태 → 외부 시스템 동기화" 용도인데, 반대로 외부 값(`localStorage`/`matchMedia`)을 읽어 React 상태를 갱신하는 구조라 다음 순서로 캐스케이딩 렌더가 발생:

1. `theme="light"` 기본값으로 첫 렌더
2. 마운트 후 effect 실행
3. `setTheme(initial)`로 즉시 재렌더

## 수정

`useSyncExternalStore`로 외부 스토어(`localStorage` + `matchMedia`)를 직접 구독하도록 변경. `useEffect`는 DOM class를 React 상태에 동기화하는 역할만 담당(허용되는 패턴).

```diff
- import { createContext, useContext, useEffect, useState } from "react";
+ import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

+ function getSnapshot(): Theme {
+   const saved = localStorage.getItem(THEME_KEY) as Theme | null;
+   if (saved) return saved;
+   return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
+ }
+
+ function getServerSnapshot(): Theme {
+   return "light";
+ }
+
+ function subscribe(onStoreChange: () => void) {
+   const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
+   mediaQuery.addEventListener("change", onStoreChange);
+   window.addEventListener("storage", onStoreChange);
+   return () => {
+     mediaQuery.removeEventListener("change", onStoreChange);
+     window.removeEventListener("storage", onStoreChange);
+   };
+ }

- const [theme, setTheme] = useState<Theme>("light");
-
- useEffect(() => {
-   const saved = localStorage.getItem("theme") as Theme | null;
-   const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
-   const initial: Theme = saved ?? (prefersDark ? "dark" : "light");
-   setTheme(initial);
-   document.documentElement.classList.toggle("dark", initial === "dark");
- }, []);
-
- function Toggle() {
-   setTheme((prev) => {
-     const next: Theme = prev === "light" ? "dark" : "light";
-     document.documentElement.classList.toggle("dark", next === "dark");
-     localStorage.setItem("theme", next);
-     return next;
-   });
- }
+ const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
+
+ useEffect(() => {
+   document.documentElement.classList.toggle("dark", theme === "dark");
+ }, [theme]);
+
+ function Toggle() {
+   const next: Theme = theme === "light" ? "dark" : "light";
+   localStorage.setItem(THEME_KEY, next);
+   window.dispatchEvent(new StorageEvent("storage", { key: THEME_KEY }));
+ }
```

`getServerSnapshot`이 SSR과 동일한 `"light"`를 반환하므로 하이드레이션 불일치 없이 안전하게 처리됨.

---

## 검증

| 항목 | 결과 |
|---|---|
| TypeScript 컴파일 (`tsc --noEmit`) | ✅ 오류 없음 |
| 브라우저 동작 확인 (다크 ↔ 라이트 토글) | ✅ 정상, 콘솔 경고 없음 |
| 새로고침 후 저장된 테마 유지 | ✅ 하이드레이션 에러 없음 |

---

# 프로필 사진 400 에러(next/image remotePatterns 누락) 수정

## 요구 사항

배포 환경 콘솔에 `Failed to load resource: the server responded with a status of 400 ()` 에러가 뜨며 프로필 사진이 로딩되지 않는 문제 원인 파악 및 해결.

---

## 변경 파일

- `next.config.ts`

---

## 원인

프로필 아바타는 `components/UserMenu.tsx`, `app/dashboard/profile/ProfileClient.tsx`에서 `next/image`의 `<Image>`로 렌더링됨. `next/image`는 외부 도메인 이미지를 `/_next/image?url=...` 최적화 엔드포인트로 프록시하는데, 이 엔드포인트는 요청 호스트가 `next.config.ts`의 `images.remotePatterns`에 명시적으로 허용된 도메인인지 검증하고, 아니면 400을 반환한다.

```ts
// 문제 코드 — images 설정 자체가 없음
const nextConfig: NextConfig = {
  devIndicators: false,
};
```

그런데 아바타 URL은 다음 세 외부 도메인에서 옴:

- Supabase Storage 업로드 아바타: `ljxqetlxddchylmznage.supabase.co`
- 카카오 소셜 로그인: `k.kakaocdn.net`
- 구글 소셜 로그인: `lh3.googleusercontent.com`

`remotePatterns`가 비어 있어 셋 다 허용 목록에 없었고, 프로덕션에서 `/_next/image` 요청이 400으로 거부되어 이미지가 뜨지 않았음.

## 수정

```diff
  const nextConfig: NextConfig = {
    devIndicators: false,
+   images: {
+     remotePatterns: [
+       { protocol: "https", hostname: "ljxqetlxddchylmznage.supabase.co" },
+       { protocol: "https", hostname: "k.kakaocdn.net" },
+       { protocol: "https", hostname: "lh3.googleusercontent.com" },
+     ],
+   },
  };
```

---

## 검증

| 항목 | 결과 |
|---|---|
| TypeScript 컴파일 (`tsc --noEmit`) | ✅ 오류 없음 |
| `/_next/image`에 설정된 3개 도메인 URL 요청 | ✅ "hostname not configured" 400 → 해소 (업스트림 미존재로 인한 별도 응답만 남음) |
| `/_next/image`에 미허용 도메인(`example.com`) 요청 (대조군) | ✅ 여전히 400으로 차단 — 화이트리스트 정상 동작 확인 |
