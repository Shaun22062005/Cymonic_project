import { NextRequest, NextResponse } from 'next/server';
import { extractReceiptData, runAudit, embedText } from '@/lib/ai/gemini';
import { qdrant } from '@/lib/qdrant/client';
import { createServerClient } from '@/lib/db/supabase';
import { sendAuditNotification } from '@/lib/email/resend';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('receipt') as File;
    if (!file) return NextResponse.json({ error: 'No receipt provided' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createServerClient();
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('receipts')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) throw new Error(`Failed to upload receipt: ${uploadError.message}`);
    const receiptStoragePath = uploadData.path;

    const extractedData = await extractReceiptData(buffer, file.type);

    const manualData = {
      merchant: formData.get('merchant') as string,
      amount: formData.get('amount') as string,
      currency: formData.get('currency') as string,
      category: formData.get('category') as string,
      expense_date: formData.get('expense_date') as string,
      business_purpose: formData.get('business_purpose') as string,
      employee_id: formData.get('employee_id') as string,
    };

    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert({
        employee_id: manualData.employee_id,
        merchant: manualData.merchant || extractedData.merchant,
        amount: parseFloat(manualData.amount || extractedData.amount),
        currency: manualData.currency || extractedData.currency,
        category: manualData.category || extractedData.category,
        expense_date: manualData.expense_date || extractedData.expense_date,
        business_purpose: manualData.business_purpose || '',
        receipt_storage_path: receiptStoragePath,
        status: 'auditing'
      })
      .select()
      .single();

    if (claimError) throw new Error(`Claim insertion failed: ${claimError.message}`);

    const embedding = await embedText(manualData.category || extractedData.category);
    const searchResult = await qdrant.search('policies', {
      vector: embedding,
      limit: 3,
    });

    const policyContext = searchResult.map(r => r.payload?.content).filter(Boolean).join('\n');
    const combinedData = {
      receipt: extractedData,
      user_claim: manualData
    };
    const verdict = await runAudit(combinedData, policyContext);

    const { data: auditLog, error: logError } = await supabase.from('audit_logs').insert({ 
      claim_id: claim.id, 
      verdict: verdict.status, 
      reason: verdict.reason, 
      policy_excerpt: verdict.policy_excerpt, 
      confidence_score: verdict.confidence_score, 
      raw_ai_response: verdict 
    }).select().single();

    if (logError) throw new Error(`Audit log insertion failed: ${logError.message}`);

    const { error: updateError } = await supabase
      .from('claims')
      .update({ status: verdict.status })
      .eq('id', claim.id);

    if (updateError) throw new Error(`Claim status update failed: ${updateError.message}`);

    try {
      await sendAuditNotification({
        to: "test@example.com",
        employeeName: "Employee",
        merchant: manualData.merchant || extractedData.merchant,
        amount: parseFloat(manualData.amount || extractedData.amount),
        currency: manualData.currency || extractedData.currency,
        status: verdict.status,
        reason: verdict.reason,
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
    }

    return NextResponse.json({
      claim,
      audit: auditLog
    });
  } catch (error) {
    console.error('Audit Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
