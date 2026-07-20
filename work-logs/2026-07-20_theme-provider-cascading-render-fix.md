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
