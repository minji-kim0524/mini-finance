# 웹 접근성 전반 개선

**날짜:** 2026-06-19  
**커밋:** `f8792a1`

---

## 요구 사항

스크린 리더, 키보드 전용 사용자, 보조 기술을 사용하는 사용자가 서비스를 정상적으로 이용할 수 있도록 ARIA 속성 및 키보드 인터랙션 전반을 개선한다.

---

## 개선 항목별 내용

### 1. 스킵 내비게이션 링크 (`app/layout.tsx`, `app/dashboard/layout.tsx`)

키보드 사용자가 매 페이지마다 반복되는 내비게이션을 건너뛰고 본문으로 바로 이동할 수 있도록 스킵 링크를 추가했다.

```tsx
// app/layout.tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute ..."
>
  본문으로 바로가기
</a>
```

`dashboard/layout.tsx`의 `<main>`에 `id="main-content"`를 추가해 스킵 링크의 이동 대상을 연결했다.

---

### 2. 폼 접근성 개선 (로그인 · 회원가입 · 비밀번호 찾기)

#### 문제

- `<label>`이 `<input>`을 감싸는 형태로 암묵적 연결만 되어 있어 일부 보조 기술에서 연결이 누락될 수 있었다.
- `required`, `autoComplete` 속성 누락으로 스크린 리더가 필수 여부를 안내하지 못했다.

#### 해결

모든 폼 필드에 `id`/`htmlFor` 명시적 연결, `required`, `autoComplete`를 추가했다.

```tsx
<label htmlFor="login-email">이메일</label>
<input
  id="login-email"
  type="email"
  required
  autoComplete="email"
  aria-describedby={error ? "login-error" : undefined}
/>
{error && <p id="login-error" role="alert">...</p>}
```

| 필드 | autoComplete 값 |
|---|---|
| 이메일 | `email` |
| 로그인 비밀번호 | `current-password` |
| 회원가입 비밀번호 | `new-password` |
| 이름 (개인) | `name` |
| 이름 (사업자) | `organization` |

---

### 3. 에러 / 상태 메시지 ARIA 처리

스크린 리더가 동적으로 나타나는 메시지를 즉시 읽어줄 수 있도록 ARIA 역할을 추가했다.

| 메시지 유형 | 적용 속성 | 파일 |
|---|---|---|
| 에러 메시지 (즉시 알림) | `role="alert"` | login, signup, forgot-password, upload, profile |
| 저장 성공 메시지 | `role="status"` `aria-live="polite"` | ProfileClient |
| 저장 실패 메시지 | `role="alert"` `aria-live="assertive"` | ProfileClient |
| 삭제 확인 배너 | `role="alert"` `aria-live="polite"` | DashboardClient |

---

### 4. 토글 버튼 그룹 — `role="group"` + `aria-pressed`

단일 선택 토글 버튼 그룹에 그룹 역할과 선택 상태를 명시해 스크린 리더가 "2개 중 1번 버튼 눌림" 형태로 안내할 수 있도록 했다.

```tsx
<div role="group" aria-label="계정 유형 선택">
  <button aria-pressed={accountType === "personal"}>개인</button>
  <button aria-pressed={accountType === "business"}>사업자</button>
</div>
```

적용 위치: 회원가입 계정 유형, 프로필 계정 유형, 손익 추이 기간/차트 유형, `TabSwitcher` 공용 컴포넌트

`analyticsUtils.tsx`의 `TabSwitcher`에 `label?: string` prop을 추가해 각 사용처에서 의미 있는 레이블을 주입할 수 있도록 했다.

---

### 5. 접을 수 있는 섹션 — `aria-expanded` / `aria-controls`

개인정보처리방침(회원가입)과 형식 가이드(업로드) 토글 버튼에 현재 펼침 상태와 제어 대상 ID를 연결했다.

```tsx
<button
  aria-expanded={privacyExpanded}
  aria-controls="privacy-content"
>
  개인정보처리방침 동의
</button>
<div id="privacy-content">...</div>
```

---

### 6. 취소 확인 모달 — `CancelConfirmModal` 컴포넌트 분리

프로필 편집 취소 시 나타나는 확인 모달을 별도 컴포넌트로 분리하면서 ARIA 대화상자 패턴을 완전히 적용했다.

```tsx
function CancelConfirmModal({ onConfirm, onClose }) {
  useEffect(() => {
    confirmBtnRef.current?.focus(); // 포커스 이동
    function HandleKeyDown(e) {
      if (e.key === "Escape") onClose(); // Escape로 닫기
    }
    document.addEventListener("keydown", HandleKeyDown);
    return () => document.removeEventListener("keydown", HandleKeyDown);
  }, [onClose]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      aria-describedby="cancel-modal-desc"
    >
      <p id="cancel-modal-title">변경사항 취소</p>
      <p id="cancel-modal-desc">변경된 내용은 저장되지 않습니다. 계속 하시겠습니까?</p>
      <button onClick={onClose}>아니오</button>
      <button ref={confirmBtnRef} onClick={onConfirm}>확인</button>
    </div>
  );
}
```

모달 등장 시 포커스가 자동으로 이동하고, Escape로 닫을 수 있다.

---

### 7. 파일 드롭존 — 키보드 인터랙션 추가

드래그 앤 드롭 영역은 마우스로만 조작 가능한 `<div>`였다. `role="button"` + `tabIndex` + 키보드 이벤트를 추가해 키보드 사용자도 파일을 선택할 수 있도록 했다.

```tsx
<div
  role="button"
  tabIndex={0}
  aria-label={file ? `선택된 파일: ${file.name}. 클릭하거나 Enter를 눌러 파일을 변경하세요` : "엑셀 파일을 드래그하거나 클릭해서 선택하세요"}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }}
>
```

드롭존 내부의 시각적 안내 텍스트는 `aria-label`이 이미 설명하므로 `aria-hidden="true"` 처리해 중복 읽기를 방지했다.

---

### 8. 사용자 메뉴 — ARIA 메뉴 패턴 + Escape 키

```tsx
// 트리거 버튼
<button
  aria-expanded={open}
  aria-haspopup="menu"
  aria-label="사용자 메뉴"
>

// 드롭다운
<div role="menu" aria-label="사용자 메뉴">
  <Link role="menuitem">프로필</Link>
  <button role="menuitem">로그아웃</button>
</div>
```

기존에는 외부 클릭만 닫기 트리거였으나 Escape 키 이벤트 리스너를 추가해 키보드로도 닫을 수 있도록 했다.

---

### 9. 차트 접근성

| 항목 | 적용 | 파일 |
|---|---|---|
| recharts 차트 컨테이너 | `<div role="img" aria-label="손익 추이 막대 차트 (월별)">` | MonthlyChart |
| 데이터 로딩 스피너 | `<span role="status" aria-label="데이터 불러오는 중">` + SVG `aria-hidden` | AnalyticsDashboard |
| 분석 리포트 select | `aria-label="분석할 리포트 선택"` | AnalyticsDashboard |

---

### 10. 장식 아이콘 — `aria-hidden="true"`

시각적 장식에 불과한 SVG 아이콘에 `aria-hidden="true"`를 추가해 스크린 리더가 불필요하게 읽는 것을 방지했다.

적용 위치: 카카오/구글 소셜 로그인 아이콘, 테마 전환 아이콘(해·달), 업로드 아이콘, 다운로드 아이콘, 드롭다운 화살표 등

---

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `app/layout.tsx` | 스킵 내비게이션 링크 추가 |
| `app/dashboard/layout.tsx` | `<main id="main-content">` 추가 |
| `app/auth/login/page.tsx` | id/htmlFor, required, autoComplete, aria-describedby, role="alert", 아이콘 aria-hidden |
| `app/auth/signup/page.tsx` | id/htmlFor, required, autoComplete, role="group"+aria-pressed, aria-expanded/aria-controls, role="alert", aria-hidden |
| `app/auth/forgot-password/page.tsx` | id/htmlFor, required, autoComplete, role="alert" |
| `app/dashboard/layout.tsx` | main에 id="main-content" |
| `app/dashboard/AnalyticsDashboard.tsx` | select aria-label, 스피너 role="status", TabSwitcher label prop |
| `app/dashboard/DashboardClient.tsx` | 전체선택 aria-label, 삭제확인 role="alert", 삭제버튼 aria-label |
| `app/dashboard/MonthlyChart.tsx` | 버튼그룹 role="group"+aria-pressed, 차트 role="img" |
| `app/dashboard/profile/ProfileClient.tsx` | 계정유형 role="group"+aria-pressed, 에러 role="alert", 이름 htmlFor+autoComplete, 저장메시지 role+aria-live, CancelConfirmModal 분리 |
| `app/dashboard/upload/UploadClient.tsx` | 드롭존 role="button"+키보드, 형식가이드 aria-expanded/aria-controls, 아이콘 aria-hidden |
| `app/utils/analyticsUtils.tsx` | TabSwitcher에 label prop, role="group", aria-pressed |
| `components/ThemeToggle.tsx` | 아이콘 aria-hidden |
| `components/UserMenu.tsx` | aria-expanded, aria-haspopup, role="menu/menuitem", Escape 키 |
