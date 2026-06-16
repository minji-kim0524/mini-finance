# 상단 메뉴바 스크롤 고정

**날짜:** 2026-06-16  
**커밋:** `31413e1`

---

## 요구 사항

스크롤을 내려도 대시보드 상단 메뉴바가 화면 상단에 고정되도록 처리.

---

## 변경 파일

`app/dashboard/layout.tsx`

---

## 변경 내용

`<header>` 태그에 `sticky top-0 z-10` 클래스 추가.

```diff
- <header className="flex h-14 shrink-0 items-center ...">
+ <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center ...">
```

- `sticky top-0` — 스크롤 시 뷰포트 상단에 고정
- `z-10` — 아래 콘텐츠 위에 헤더가 겹쳐 보이도록 레이어 순서 지정
