# 대시보드 전체 리포트 개수 표시 형식 개선

**날짜:** 2026-06-26  
**커밋:** `dcd3e52`

---

## 요구 사항

대시보드 통계 카드의 "전체 리포트" 항목이 업로드된 파일 수만 단순 표시(`N개`)하고 있었다.  
무료 플랜 사용자에게는 내역 관리 페이지의 PlanBadge(`N/3 리포트 사용 중`)와 동일한 맥락으로,  
현재 사용량 / 최대 허용량 형식(`N/3개`)으로 표시하도록 변경한다.  
Pro 플랜은 한도 없이 `N개`를 유지한다.

---

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `app/utils/analyticsUtils.tsx` | `BuildStats`에 `plan` 파라미터 추가, 무료 플랜 표시 형식 분기 |
| `app/dashboard/AnalyticsDashboard.tsx` | `plan` prop 추가 및 `BuildStats` 호출 시 전달 |
| `app/dashboard/DashboardChart.tsx` | `plan` prop 추가 및 `AnalyticsDashboard`로 전달 |
| `app/dashboard/page.tsx` | `DashboardChart`에 `plan` prop 전달 |

---

## 변경 상세

### `app/utils/analyticsUtils.tsx`

무료 플랜 한도를 상수 `FREE_PLAN_REPORT_LIMIT = 3`으로 선언해 숫자가 변경될 때 한 곳만 수정하면 되도록 했다.

`BuildStats` 함수 시그니처에 `plan: string = "free"` 파라미터를 추가하고,  
무료 플랜이면 `N/3개`, Pro 플랜이면 `N개`를 반환한다.

```ts
const FREE_PLAN_REPORT_LIMIT = 3;

export function BuildStats(reports: Report[], plan: string = "free") {
  ...
  const reportCountValue = plan === "free"
    ? `${reports.length}/${FREE_PLAN_REPORT_LIMIT}개`
    : `${reports.length}개`;
  return [
    { label: "전체 리포트", value: reportCountValue, sub: "업로드된 파일" },
    ...
  ];
}
```

### prop 전달 체인

`page.tsx`(서버)에서 이미 `plan`을 조회하고 있었으므로,  
`DashboardChart` → `AnalyticsDashboard` 순서로 prop만 추가 전달했다.

---

## 기술 결정

- `plan` 기본값을 `"free"`로 설정해 혹시 prop이 누락되어도 안전한 방향(한도 표시)으로 동작한다.
- 한도 숫자(`3`)를 인라인 리터럴 대신 상수로 분리해 추후 플랜 정책 변경 시 `analyticsUtils.tsx` 한 곳만 수정하면 된다.
- 관련 없는 코드(차트, 내역 관리, API 등)는 변경하지 않았다.
