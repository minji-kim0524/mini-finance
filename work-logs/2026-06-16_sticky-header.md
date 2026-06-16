# 상단 메뉴바 스크롤 고정

**날짜:** 2026-06-16  
**커밋:** `31413e1`, `9753a82`

---

## 요구 사항

스크롤을 내려도 대시보드 상단 메뉴바(로고 포함 전체 너비)가 화면 상단에 고정되도록 처리.

---

## 변경 파일

- `app/dashboard/layout.tsx`
- `components/Sidebar.tsx`

---

## 1차 변경 (커밋 `31413e1`)

`<header>` 태그에 `sticky top-0 z-10` 클래스 추가.

```diff
- <header className="flex h-14 shrink-0 items-center ...">
+ <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center ...">
```

---

## 2차 변경 (커밋 `9753a82`) — 로고까지 헤더에 포함

기존에는 로고(MINI-Finance)가 Sidebar 안에 있어 헤더 고정 범위에서 빠져 있었음.  
로고를 헤더 좌측으로 이동하고, 전체 너비의 단일 헤더로 통합.

### 레이아웃 구조 변경

**변경 전**
```
<div class="flex min-h-screen">          ← 전체 컨테이너
  <aside>                                 ← 사이드바 (로고 포함)
    <div>MINI-Finance 로고</div>
    <nav>...</nav>
  </aside>
  <div class="flex flex-col">
    <header class="sticky ...">           ← 우측 헤더만 고정
    <main>
  </div>
</div>
```

**변경 후**
```
<div class="flex h-screen flex-col">     ← 전체 컨테이너
  <header class="sticky top-0 z-10 flex h-14"> ← 전체 너비 헤더 고정
    <div class="w-56">MINI-Finance 로고</div>   ← 좌: 로고
    <div class="flex-1">버튼, 테마, 유저메뉴</div> ← 우: 컨트롤
  </header>
  <div class="flex flex-1 overflow-hidden">
    <aside>                               ← 사이드바 (네비게이션만)
    <div class="flex flex-1 overflow-auto">
      <main>
    </div>
  </div>
</div>
```

### 핵심 변경 포인트

| 항목 | 변경 내용 |
|---|---|
| `layout.tsx` 외부 컨테이너 | `min-h-screen` → `h-screen flex-col` |
| 헤더 | 우측 전용 → 전체 너비, 로고 좌측 배치 |
| 본문 영역 | `overflow-hidden` 으로 감싸 내부 스크롤 처리 |
| `Sidebar.tsx` | 로고 `<div>` 제거 (헤더로 이동) |
