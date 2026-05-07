import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseExcel } from '@/lib/excelParser';
import { calcPLSummary } from '@/lib/aggregator';

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = parseExcel(buffer);

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
