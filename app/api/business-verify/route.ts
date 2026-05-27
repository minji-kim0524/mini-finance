import { NextRequest, NextResponse } from "next/server";

type VerifyStatus = "active" | "suspended" | "closed" | "invalid";

const statusMap: Record<string, { status: VerifyStatus; message: string }> = {
  "01": { status: "active",    message: "정상 등록된 사업자입니다." },
  "02": { status: "suspended", message: "현재 휴업 중인 사업자입니다." },
  "03": { status: "closed",    message: "폐업한 사업자입니다." },
};

export async function POST(request: NextRequest) {
  const { businessNumber } = await request.json();

  const digits = (businessNumber ?? "").replace(/\D/g, "");
  if (digits.length !== 10) {
    return NextResponse.json(
      { error: "사업자등록번호는 10자리여야 합니다." },
      { status: 400 },
    );
  }

  const serviceKey = process.env.NTS_API_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "사업자번호 조회 서비스가 설정되지 않았습니다. 관리자에게 문의하세요." },
      { status: 503 },
    );
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${serviceKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ b_no: [digits] }),
      },
    );
  } catch {
    return NextResponse.json(
      { error: "국세청 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "국세청 API 호출에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }

  const data = await res.json();
  const item = data.data?.[0];

  if (!item || data.match_cnt === 0) {
    return NextResponse.json({ status: "invalid", message: "등록되지 않은 사업자등록번호입니다." });
  }

  return NextResponse.json(
    statusMap[item.b_stt_cd] ?? { status: "invalid", message: "조회 결과를 확인할 수 없습니다." },
  );
}
