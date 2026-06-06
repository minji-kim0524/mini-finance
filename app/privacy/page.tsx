import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | MINI-Finance",
};

const EFFECTIVE_DATE = "2025년 1월 1일";
const SERVICE_NAME = "MINI-Finance";
const COMPANY_NAME = "MINI-Finance";
const CONTACT_EMAIL = "always00524@gmail.com";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            ← 홈으로
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 space-y-10 dark:border-slate-800 dark:bg-slate-900 md:p-12">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              개인정보 처리방침
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              시행일: {EFFECTIVE_DATE}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {SERVICE_NAME}(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요하게 생각하며,
            「개인정보 보호법」 및 관련 법령을 준수합니다. 본 방침은 서비스가
            수집하는 개인정보의 항목, 수집 및 이용 목적, 보유 기간, 그리고
            이용자의 권리를 안내합니다.
          </p>

          <Section title="1. 수집하는 개인정보 항목 및 수집 방법">
            <SubSection title="가. 회원가입 (이메일)">
              <InfoTable
                rows={[
                  { label: "수집 항목", value: "이메일 주소, 비밀번호(암호화 저장)" },
                  { label: "수집 방법", value: "이용자 직접 입력" },
                ]}
              />
            </SubSection>
            <SubSection title="나. 소셜 로그인 (카카오)">
              <InfoTable
                rows={[
                  {
                    label: "수집 항목",
                    value:
                      "카카오계정 이메일, 닉네임, 프로필 이미지 (이용자 동의 항목에 한함)",
                  },
                  { label: "수집 방법", value: "카카오 OAuth 2.0 인증을 통한 자동 수집" },
                ]}
              />
            </SubSection>
            <SubSection title="다. 소셜 로그인 (Google)">
              <InfoTable
                rows={[
                  {
                    label: "수집 항목",
                    value: "Google 계정 이메일, 이름, 프로필 이미지",
                  },
                  { label: "수집 방법", value: "Google OAuth 2.0 인증을 통한 자동 수집" },
                ]}
              />
            </SubSection>
            <SubSection title="라. 서비스 이용">
              <InfoTable
                rows={[
                  {
                    label: "수집 항목",
                    value: "업로드한 재무 데이터 파일, 분석 결과, 서비스 이용 기록",
                  },
                  { label: "수집 방법", value: "이용자 직접 업로드 및 자동 생성" },
                ]}
              />
            </SubSection>
          </Section>

          <Section title="2. 개인정보 수집 및 이용 목적">
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <ListItem>회원 식별 및 서비스 로그인·인증</ListItem>
              <ListItem>재무 데이터 분석 서비스 제공</ListItem>
              <ListItem>분석 결과 저장 및 이용자별 맞춤 제공</ListItem>
              <ListItem>유료 플랜 결제 및 구독 관리</ListItem>
              <ListItem>서비스 관련 고지사항 전달 및 고객 문의 응대</ListItem>
              <ListItem>서비스 개선 및 신규 기능 개발</ListItem>
            </ul>
          </Section>

          <Section title="3. 개인정보 보유 및 이용 기간">
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              이용자의 개인정보는 서비스 탈퇴 또는 동의 철회 시 즉시 파기합니다.
              단, 관련 법령에 따라 아래 기간 동안 보관합니다.
            </p>
            <InfoTable
              rows={[
                {
                  label: "계약 또는 청약철회에 관한 기록",
                  value: "5년 (전자상거래법)",
                },
                {
                  label: "대금 결제 및 재화 공급에 관한 기록",
                  value: "5년 (전자상거래법)",
                },
                {
                  label: "소비자 불만·분쟁 처리에 관한 기록",
                  value: "3년 (전자상거래법)",
                },
                { label: "접속 로그 및 접속 IP", value: "3개월 (통신비밀보호법)" },
              ]}
            />
          </Section>

          <Section title="4. 개인정보의 제3자 제공">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
              다만, 이용자의 사전 동의가 있거나 법령에 의해 요구되는 경우에는
              예외적으로 제공할 수 있습니다.
            </p>
          </Section>

          <Section title="5. 개인정보 처리 위탁">
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              서비스는 원활한 운영을 위해 아래와 같이 개인정보 처리를 위탁합니다.
            </p>
            <InfoTable
              rows={[
                {
                  label: "Supabase Inc.",
                  value: "회원 인증 및 데이터베이스 운영",
                },
                {
                  label: "Stripe Inc.",
                  value: "결제 처리 및 구독 관리",
                },
                {
                  label: "Vercel Inc.",
                  value: "서비스 호스팅 및 인프라 운영",
                },
              ]}
            />
          </Section>

          <Section title="6. 개인정보의 파기 절차 및 방법">
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <ListItem>
                전자적 파일: 복구 불가능한 방법으로 영구 삭제
              </ListItem>
              <ListItem>
                회원 탈퇴 시 지체 없이 파기 (법령 보관 의무 항목 제외)
              </ListItem>
            </ul>
          </Section>

          <Section title="7. 이용자의 권리 및 행사 방법">
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              이용자는 언제든지 아래 권리를 행사할 수 있습니다.
            </p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <ListItem>개인정보 열람·정정·삭제 요청</ListItem>
              <ListItem>개인정보 처리 정지 요청</ListItem>
              <ListItem>동의 철회(회원 탈퇴)</ListItem>
            </ul>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              권리 행사는 서비스 내 프로필 설정 페이지 또는 아래 개인정보
              보호책임자에게 이메일로 요청하실 수 있습니다.
            </p>
          </Section>

          <Section title="8. 쿠키 및 자동 수집 장치">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다. 브라우저 설정을
              통해 쿠키를 거부할 수 있으나, 이 경우 로그인 등 일부 기능이
              제한될 수 있습니다.
            </p>
          </Section>

          <Section title="9. 개인정보 보호책임자">
            <InfoTable
              rows={[
                { label: "서비스명", value: SERVICE_NAME },
                { label: "운영자", value: COMPANY_NAME },
                { label: "이메일", value: CONTACT_EMAIL },
              ]}
            />
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              개인정보 처리에 관한 문의, 불만, 피해 구제 등은 위 이메일로
              연락주시면 신속하게 처리하겠습니다.
            </p>
          </Section>

          <Section title="10. 개인정보 처리방침 변경">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              본 방침은 시행일로부터 적용되며, 변경 시 서비스 내 공지 또는
              이메일을 통해 사전 안내합니다. 변경된 방침은 공지 후 7일이
              경과한 날부터 효력이 발생합니다.
            </p>
          </Section>

          <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              시행일: {EFFECTIVE_DATE} | {SERVICE_NAME}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</h3>
      {children}
    </div>
  );
}

function InfoTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:gap-4 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-slate-200 dark:[&:not(:last-child)]:border-slate-700"
        >
          <span className="w-52 shrink-0 font-medium text-slate-700 dark:text-slate-300">
            {row.label}
          </span>
          <span className="text-slate-600 dark:text-slate-400">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
      <span>{children}</span>
    </li>
  );
}
