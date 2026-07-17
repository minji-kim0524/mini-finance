# ReportViewer.tsx 파일 분리 (150줄 이하)

**날짜:** 2026-07-18

---

## 요구 사항

`app/dashboard/[reportId]/ReportViewer.tsx` 파일이 1089줄로 비대해져 아래 원칙에 따라 150줄 이하로 줄인다.

- 파일 내 컴포넌트 분리 후 import 하여 사용
- 자주 쓰이는 기능은 lib 폴더에 파일로 분리하여 import 하여 사용
- 코드가 더 복잡해지지 않는다면 함수는 utils 폴더에 파일로 분리하여 import 하여 사용
- 의미없는 `<div>`의 무분별한 사용 금지 → 시맨틱 마크업 진행

---

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `app/dashboard/[reportId]/ReportViewer.tsx` | 1089줄 → 132줄. 상태·핸들러·조립 로직만 남기고 나머지는 아래 파일들로 분리 |
| `app/dashboard/[reportId]/FinanceTableRows.tsx` | 신규. 테이블 행 컴포넌트(`TableHeader`, `SectionRow`, `SubtotalRow`, `AccountRow`, `CategoryRow`, `EmptyState`) |
| `app/dashboard/[reportId]/StatementCard.tsx` | 신규. 손익계산서·재무상태표·제조원가명세서 뷰가 공통으로 쓰던 카드 레이아웃(제목/기간/표 래퍼)을 하나로 통합 |
| `app/dashboard/[reportId]/DashboardView.tsx` | 신규. 대시보드 탭 뷰 컴포넌트 분리 |
| `app/dashboard/[reportId]/IncomeStatementView.tsx` | 신규. 손익계산서 탭 뷰 컴포넌트 분리 |
| `app/dashboard/[reportId]/BalanceSheetView.tsx` | 신규. 재무상태표 탭 뷰 컴포넌트 분리 |
| `app/dashboard/[reportId]/MfgCostView.tsx` | 신규. 제조원가명세서 탭 뷰 컴포넌트 분리 |
| `app/dashboard/[reportId]/ClassifyView.tsx` | 신규. 계정 분류 탭 뷰 컴포넌트 분리 |
| `app/dashboard/[reportId]/ReportToolbar.tsx` | 신규. 탭 전환 + PDF/Excel 내보내기 버튼 툴바 분리 |
| `app/dashboard/[reportId]/CompareSelector.tsx` | 신규. 전기 비교 select 박스 분리 |
| `lib/financeAggregation.ts` | 신규. `FmtNum`, `GroupByAccount`, `Sum`, `GetAmount`, `GetDateRange` — 여러 뷰에서 공통으로 쓰던 집계 함수 |
| `lib/financeClassify.ts` | 신규. `SubClassify`(유동/비유동), `SubClassifyMfgCost`(재료비/노무비/제조경비), `typeLabels`, `typeColors`, `allTypes` |
| `lib/reportExcelExport.ts` | 신규. `ExportIncomeStatement`, `ExportBalanceSheet`, `ExportMfgCostStatement` 엑셀 내보내기 로직 |
| `app/utils/Icons.tsx` | `ExcelExportIcon`, `PrintIcon` 추가 (기존 `ExcelIcon`과 스타일이 달라 별도 이름으로 추가) |

---

## 변경 상세

### 계산 로직 → lib

세 뷰(손익계산서/재무상태표/제조원가명세서)에 동일하게 3번 반복되던 `CAmt` 헬퍼를 `GetAmount` 하나로 통합했다. `ExportBalanceSheet`가 인라인으로 `currentAssetKw.some(...)` 검사를 직접 하던 부분도 `lib/financeClassify.ts`의 `SubClassify` 호출로 교체해 중복을 제거했다(동작은 동일).

### 공통 카드 레이아웃 추출

세 뷰에서 제목·기간 표시·`(단위: 원)`·`<table>` 래퍼가 토큰 단위까지 동일하게 반복되고 있어 `StatementCard` 컴포넌트로 묶었다. 단, 제조원가명세서는 원래 날짜 범위를 필터링된 `mfgRows` 기준으로 계산하던 차이가 있어, `StatementCard`가 `currentRangeRows`/`compareRangeRows`를 각 뷰에서 주입받는 구조로 설계해 기존 동작을 그대로 유지했다.

### 시맨틱 마크업

- 탭 전환 영역: `<div>` → `<nav role="tablist">` + 버튼에 `role="tab"`, `aria-selected`
- 인쇄 대상 영역: `<div role="region" aria-label="재무제표">`로 역할 명시
- 통계 카드(`StatementCard`, `DashboardView`의 요약/미분류 카드, `ClassifyView` 카드): `<div>` → `<section>`/`<header>`
- 계정 목록(`ClassifyView`), 손익 요약 세부 항목·미분류 목록(`DashboardView`): 반복되는 `<div>` 목록 → `<ul>`/`<li>`

### 검증

- `npx tsc --noEmit` 통과
- `npx eslint` 통과 (기존에도 있던 `useMemo` 의존성 배열 경고 8건은 원본 코드 그대로 옮긴 것으로, 이번 작업 범위 밖이라 손대지 않음)
- `npm run build` 성공
- 로그인 세션이 필요한 페이지라 브라우저 수동 확인은 하지 못했고, dev 서버 기동 및 빌드로 확인함

---

## 기술 결정

- 컴포넌트는 전역 `components/` 대신 `app/dashboard/[reportId]/` 폴더에 같은 위치로 분리했다. 기존 `MonthlyChart.tsx`, `DashboardChart.tsx`도 같은 방식으로 페이지 폴더에 colocate 되어 있어 컨벤션을 따랐다.
- 아이콘(`ExcelExportIcon`, `PrintIcon`)은 이미 존재하는 `app/utils/Icons.tsx`에 추가해 아이콘 파일이 여러 개로 흩어지지 않게 했다.
- 기존 로직·클래스명·조건 분기는 전부 그대로 옮겼고, 동작이 바뀌는 리팩토링(예: 날짜 범위 계산 방식 통일)은 하지 않았다.
