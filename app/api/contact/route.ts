import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = "always00524@gmail.com";

export async function POST(req: Request) {
  const { name, email, message } = await req.json() as {
    name: string;
    email: string;
    message: string;
  };

  if (!message.trim()) {
    return NextResponse.json({ error: "문의 내용을 입력해주세요." }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "MINI-Finance 고객지원 <onboarding@resend.dev>",
    to: TO,
    replyTo: email || undefined,
    subject: `[고객의견] ${name || "익명"} 님의 문의`,
    text: [
      `이름: ${name || "미입력"}`,
      `이메일: ${email || "미입력"}`,
      "",
      message,
    ].join("\n"),
  });

  if (error) {
    return NextResponse.json({ error: "메일 전송에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
