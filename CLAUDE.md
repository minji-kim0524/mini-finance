@AGENTS.md

# 네이밍 컨벤션

## PascalCase
- 함수명 (일반 함수, 이벤트 핸들러, 유틸 함수 포함)
- 페이지 내부 함수명
- 컴포넌트 파일명 (예: `LoginButton.tsx`, `UserMenu.tsx`)

## camelCase
- 변수명 및 상수명 (예: `navItems`, `summaryLabels`, `inputCls`)
- 속성명 (props, object key)
- 테일윈드 클래스 조합 변수
- 페이지 파일명 (예: `page.tsx`, `layout.tsx`)
- Non-컴포넌트 파일명 (예: `authErrors.ts`, `analyticsUtils.tsx`)

## 예외 (프레임워크 예약어)
- `proxy.ts`의 `proxy` export — Next.js가 소문자 고정 요구
- `page.tsx`, `layout.tsx`, `route.ts` 등 Next.js 파일 구조 예약명은 변경 불가
