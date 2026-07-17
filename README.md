# Mini Finance

엑셀로 정리한 재무 데이터를 업로드하면 손익계산서·재무상태표를 자동으로 분석해 대시보드로 보여주는 재무 리포트 서비스입니다.

## 서비스 개요

- **엑셀 업로드 & 자동 분석**: 회계 엑셀 파일을 업로드하면 계정과목을 자동으로 분류하고, 손익계산서와 재무상태표 기준으로 집계합니다.
- **대시보드**: 총매출, 매출총이익, 영업이익 등 핵심 지표와 월별 추이를 차트로 확인할 수 있습니다.
- **리포트 관리**: 업로드한 리포트를 저장·조회하고, 개별 리포트 상세 페이지에서 계정 분류를 수동으로 수정할 수 있습니다.
- **사업자 진위확인**: 국세청 API를 연동해 사업자 정보를 검증합니다.
- **요금제**: 무료 플랜(리포트 최대 3개)과 Stripe 결제 기반 Pro 플랜(무제한)을 제공합니다.
- **인증**: 회원가입/로그인/비밀번호 재설정 등 이메일 기반 인증 플로우를 지원합니다.
- **PDF/인쇄**: 리포트를 인쇄하거나 출력용으로 내보낼 수 있습니다.

## 기술 스택

- **프레임워크**: Next.js 16 (App Router), React 19
- **언어**: TypeScript
- **스타일**: Tailwind CSS 4
- **인증/DB**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **결제**: Stripe
- **차트**: Recharts
- **엑셀 파싱**: xlsx
- **인쇄**: react-to-print
- **아이콘**: lucide-react

## 사용 방법

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 채워주세요.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
NTS_API_KEY=
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속 후 확인합니다.

### 4. 기타 명령어

```bash
npm run build   # 프로덕션 빌드
npm run start   # 프로덕션 서버 실행
npm run lint    # ESLint 검사
```

### 주요 사용 흐름

1. 회원가입 또는 로그인 (`/auth/login`, `/auth/signup`)
2. 대시보드에서 엑셀 파일 업로드 (`/dashboard/upload`)
3. 업로드된 리포트가 자동 분석되어 대시보드에 지표/차트로 표시
4. 필요 시 리포트 상세 페이지에서 계정 분류 수정 (`/dashboard/[reportId]`)
5. 무료 플랜 한도(리포트 3개) 초과 시 `/pricing`에서 Pro 플랜으로 업그레이드
