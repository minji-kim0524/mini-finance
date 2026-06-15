# 성능 최적화 — Scripting 시간 단축

**날짜:** 2026-06-15  
**커밋:** `4aeb672`

---

## 요구 사항

DevTools Performance 탭에서 Scripting 시간이 주황색으로 길게 나타나는 문제 해결.  
1순위·2순위 적용 → 테스트 → 커밋 → 푸시 순서로 진행.

---

## 원인 분석

### 1순위: `xlsx` 최상단 import (7.2MB 패키지)

| 파일 | 문제 |
|---|---|
| `app/dashboard/upload/UploadClient.tsx:5` | `import * as XLSX from "xlsx"` — 페이지 진입 즉시 파싱 |
| `app/dashboard/[reportId]/ReportViewer.tsx:5` | 동일 — 리포트 페이지 진입 즉시 파싱 |

xlsx는 **버튼 클릭 시점**에만 필요한 라이브러리인데도 초기 번들에 포함돼 있었음.  
실제 사용 위치: `DownloadSample()`, `ExportIncomeStatement()`, `ExportBalanceSheet()` 세 함수 내부.

### 2순위: `html2canvas` (4.4MB) + `jspdf` (29MB) 미사용 패키지

`package.json`에 선언되어 있으나 앱 코드 어디에서도 import 없음.  
PDF 기능은 `react-to-print`(브라우저 print API)로 구현되어 있어 두 패키지가 실제로는 불필요.

---

## 제시한 해결 방안 (전체)

| 우선순위 | 작업 | 기대 효과 |
|---|---|---|
| 🔴 1순위 | `xlsx` 동적 import 전환 | 초기 번들 ~480KB 감소 |
| 🔴 2순위 | `html2canvas` + `jspdf` 제거 | 의존성 정리 |
| 🟡 3순위 | `recharts` `next/dynamic` 처리 | 대시보드 초기 로드 분리 |
| 🟡 4순위 | `react-to-print` 분리 | 리포트 페이지 개선 |
| 🟢 5순위 | `predictData` 탭 미선택 시 계산 스킵 | 탭 전환 반응성 개선 |

---

## 실제 적용한 내용 (1·2순위)

### 1-A. `UploadClient.tsx` — `DownloadSample` 동적 import

```diff
- import * as XLSX from "xlsx";

- function DownloadSample() {
+ async function DownloadSample() {
+   const XLSX = await import("xlsx");
    const data = [ ... ];
    XLSX.utils.aoa_to_sheet(data);
    ...
  }
```

### 1-B. `ReportViewer.tsx` — 내보내기 함수들 동적 import

```diff
- import * as XLSX from "xlsx";

+ type XLSXModule = typeof import("xlsx");
+
- function MakeSheet(data: Row[], colWidths: number[]): XLSX.WorkSheet {
+ function MakeSheet(XLSX: XLSXModule, data: Row[], colWidths: number[]) {

- function ExportIncomeStatement(rows, filename) {
+ async function ExportIncomeStatement(rows, filename) {
+   const XLSX = await import("xlsx");
    ...
-   MakeSheet(data, [32, 18, 18])
+   MakeSheet(XLSX, data, [32, 18, 18])
  }

- function ExportBalanceSheet(rows, filename) {
+ async function ExportBalanceSheet(rows, filename) {
+   const XLSX = await import("xlsx");
    ...
  }

- function HandleExcelExport() {
+ async function HandleExcelExport() {
-   ExportIncomeStatement(rows, name);
+   await ExportIncomeStatement(rows, name);
  }
```

### 2. `html2canvas` + `jspdf` 패키지 제거

```bash
npm uninstall html2canvas jspdf
# 23개 관련 패키지 함께 제거
```

---

## 테스트 결과

| 항목 | 결과 |
|---|---|
| TypeScript 컴파일 (`tsc --noEmit`) | ✅ 오류 없음 |
| 프로덕션 빌드 (`next build`) | ✅ 21개 라우트 정상 |
| 업로드 페이지 초기 로드 19개 청크 중 xlsx 포함 여부 | ✅ 없음 |
| 리포트 페이지 초기 로드 청크 중 xlsx 포함 여부 | ✅ 없음 |
| 콘솔 오류 | ✅ 없음 |

> 버튼 실제 클릭(xlsx 파일 생성)은 Supabase 인증 필요로 헤드리스 환경에서 미수행.  
> 대신 TypeScript 컴파일 + 번들 네트워크 추적으로 동작 정합성 확인.

---

## 미적용 항목 (향후 검토)

- `recharts` → `next/dynamic` + `ssr: false`로 대시보드 차트 지연 로드
- `react-to-print` → 별도 컴포넌트 분리 후 동적 import
- `predictData` useMemo에 `chartTab !== "predict"` 조건 추가해 탭 미선택 시 계산 생략
