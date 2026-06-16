# BirthDatePicker React Compiler 오류 수정

**날짜:** 2026-06-17  
**커밋:** `7be4ff0`

---

## 요구 사항

VS Code Problems 패널에 표시된 ESLint(React Compiler) 오류 2건 해결.

---

## 변경 파일

- `app/dashboard/profile/BirthDatePicker.tsx`

---

## 오류 1 — 렌더 중 ref 변이 (Cannot mutate a ref during render)

### 원인

`WheelColumn` 컴포넌트 내부에서 `cbRef.current = onChange`를 렌더 바디에 직접 작성.  
React 19 / React Compiler는 렌더 중 ref 변이를 명시적으로 금지한다.

```ts
// 문제 코드 (렌더 바디 직접 변이)
cbRef.current = onChange;
```

### 수정

`useLayoutEffect`로 감싸 DOM 커밋 직후 실행되도록 변경.  
`useLayoutEffect`는 `useEffect`보다 먼저 실행되므로 이어지는 effect가 호출될 때 `cbRef.current`는 항상 최신 `onChange`를 참조한다.

```diff
+ import { useState, useRef, useEffect, useLayoutEffect } from "react";

- cbRef.current = onChange;
+ useLayoutEffect(() => {
+   cbRef.current = onChange;
+ });
```

---

## 오류 2 — useEffect 내부 setState 동기 호출 (setState in effect body)

### 원인

휠 모드 전환 시 연도·월 인덱스를 동기화하기 위해 `useEffect` 내부에서 `setWYIdx`, `setWMIdx`를 동기 호출.  
React는 effect 바디에서 setState를 동기 호출하면 cascading render가 발생한다고 경고한다.

```ts
// 문제 코드
useEffect(() => {
  if (mode === "wheel") {
    setWYIdx(Math.max(0, years.indexOf(`${viewY}년`)));
    setWMIdx(viewM - 1);
  }
}, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
```

### 수정

effect를 제거하고, 휠 모드를 여는 이벤트 핸들러 `OpenWheel`에서 세 상태를 한 번에 설정.  
상태 설정이 단일 이벤트 내에서 일어나므로 React가 한 번의 렌더로 처리한다.

```diff
- useEffect(() => {
-   if (mode === "wheel") {
-     setWYIdx(Math.max(0, years.indexOf(`${viewY}년`)));
-     setWMIdx(viewM - 1);
-   }
- }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

+ function OpenWheel() {
+   setWYIdx(Math.max(0, years.indexOf(`${viewY}년`)));
+   setWMIdx(viewM - 1);
+   setMode("wheel");
+ }
```

버튼 핸들러도 `() => setMode("wheel")` → `OpenWheel`로 교체 (2곳).

---

## 검증

| 항목 | 결과 |
|---|---|
| ESLint (`npx eslint BirthDatePicker.tsx`) | ✅ 오류 없음 |
| TypeScript 컴파일 (`tsc --noEmit`) | ✅ 오류 없음 |
| 프로덕션 빌드 (`next build`) | ✅ 21개 라우트 정상 |
