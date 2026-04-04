import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('claims')
    .select('*, audit_logs(verdict, confidence_score, reason, policy_excerpt)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  console.log('Raw claims data:', JSON.stringify(data[0], null, 2));
  
  const mappedData = data.map((claim: any) => ({
    ...claim,
    confidence_score: claim.audit_logs?.[0]?.confidence_score || 0,
    reason: claim.audit_logs?.[0]?.reason || null,
    audit_summary: claim.audit_logs?.[0]?.reason || null,
    policy_excerpt: claim.audit_logs?.[0]?.policy_excerpt || null,
  }));

  return NextResponse.json(mappedData);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from('claims')
      .insert(body)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
