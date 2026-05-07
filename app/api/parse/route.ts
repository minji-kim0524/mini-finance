import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseExcel } from '@/lib/excelParser';
import { calcPLSummary } from '@/lib/aggregator';
import type { FinanceRow } from '@/types/finance';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
  }

  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    return NextResponse.json({ error: '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let rows: FinanceRow[];
  try {
    rows = parseExcel(buffer);
  } catch {
    return NextResponse.json({ error: '파일을 읽을 수 없습니다. 올바른 엑셀 형식인지 확인해주세요.' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: '분석할 데이터가 없습니다. 날짜·계정과목·금액 열이 있는지 확인해주세요.' }, { status: 400 });
  }

  const { error } = await supabase.from('finance_rows').insert(
    rows.map((row) => ({
      user_id: user.id,
      date: row.date,
      account: row.account,
      amount: row.amount,
      type: row.type,
    }))
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows, summary: calcPLSummary(rows) });
}
