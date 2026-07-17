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

---

- 모든 파일 마지막 라인에 </content> 사용 금지
- 작업이 완료되면 자동으로 커밋하고 푸시진행
- 누구나 쉽게 이해할 수 있는 간결하고 추후 디버깅이 쉬운 코드로 작업 진행
- 진행 작업 내용과 관련없는 코드 및 파일 수정 금지
- 작업완료시 work-logs 폴더에 작업 로그 파일 작성(일자별 하나의 md 파일생성 - md 파일 내에는 작업별 로그 기록)
