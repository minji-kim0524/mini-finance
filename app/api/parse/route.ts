import { NextRequest, NextResponse } from 'next/server';
import { CreateClient } from '@/lib/supabase/server';
import { ParseExcel } from '@/lib/excelParser';
import { CalcPLSummary } from '@/lib/aggregator';
import type { FinanceRow } from '@/types/finance';

const maxFileSize = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const supabase = await CreateClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single();

  const isPro = sub?.plan === 'pro';

  if (!isPro) {
    const { count } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: '무료 플랜은 리포트를 3개까지만 저장할 수 있습니다. Pro로 업그레이드하세요.', code: 'FREE_LIMIT' },
        { status: 403 }
      );
    }
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
  }

  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    return NextResponse.json({ error: '엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let rows: FinanceRow[];
  try {
    rows = ParseExcel(buffer);
  } catch {
    return NextResponse.json({ error: '파일을 읽을 수 없습니다. 올바른 엑셀 형식인지 확인해주세요.' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: '분석할 데이터가 없습니다. 날짜·계정과목·금액 열이 있는지 확인해주세요.' }, { status: 400 });
  }

  const summary = CalcPLSummary(rows);

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .insert({
      user_id: user.id,
      name: file.name,
      row_count: rows.length,
      total_revenue: summary.totalRevenue,
      gross_profit: summary.grossProfit,
      operating_profit: summary.operatingProfit,
    })
    .select('id')
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: reportError?.message ?? 'Failed to create report' }, { status: 500 });
  }

  const { error: rowsError } = await supabase.from('finance_rows').insert(
    rows.map((row) => ({
      user_id: user.id,
      report_id: report.id,
      date: row.date,
      account: row.account,
      amount: row.amount,
      type: row.type,
    }))
  );

  if (rowsError) {
    await supabase.from('reports').delete().eq('id', report.id);
    return NextResponse.json({ error: rowsError.message }, { status: 500 });
  }

  return NextResponse.json({ reportId: report.id, summary });
}
