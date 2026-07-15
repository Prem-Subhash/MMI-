import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { STAGE_FIELD_GROUPS, getStageConfig } from '@/app/mortgage/lib/stageFields';
import { StageCode } from '@/app/mortgage/lib/types';

function sanitizePayloadForPostgres(payload: Record<string, any>): Record<string, any> {
  const DATE_FIELDS = [
    'application_received_date',
    'inquiry_date',
    'target_closing_date',
    'follow_up_date',
    'preapproval_sent_date',
    'submission_date',
    'lock_expire_date',
    'moonstar_disclosure_signed_date',
    'lender_disclosure_signed_date',
    'anti_predatory_completed_date',
    'moonstar_disclosure_2_signed_date',
    'appraisal_sent_date',
  ];

  const NUMERIC_FIELDS = [
    'estimated_property_value',
    'estimated_credit_score',
    'expected_commission',
    'preapproval_amount',
    'down_payment_request',
    'loan_amount',
    'interest_rate',
    'appraised_value_amount',
    'final_interest_rate',
    'final_loan_amount',
    'check_wire_amount_received',
    'client_refund_amount',
  ];

  const cleaned: Record<string, any> = { ...payload };

  for (const key of Object.keys(cleaned)) {
    const val = cleaned[key];
    if (typeof val === 'string' && val.trim() === '') {
      cleaned[key] = null;
    }
    if (DATE_FIELDS.includes(key)) {
      if (!val || (typeof val === 'string' && val.trim() === '')) {
        cleaned[key] = null;
      }
    }
    if (NUMERIC_FIELDS.includes(key)) {
      if (val === '' || val === null || val === undefined || isNaN(Number(val))) {
        cleaned[key] = null;
      } else {
        cleaned[key] = Number(val);
      }
    }
  }

  return cleaned;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineType = searchParams.get('pipeline_type');
    const stage = searchParams.get('stage');
    const search = searchParams.get('search');
    const loanOfficer = searchParams.get('loan_officer_name');
    const processor = searchParams.get('processor_name');
    const loanType = searchParams.get('loan_type');
    const transactionType = searchParams.get('transaction_type');
    const sortBy = searchParams.get('sort_by') || 'updated_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    let query = supabaseServer
      .from('mortgage_loans')
      .select('*', { count: 'exact' });

    if (pipelineType) {
      query = query.eq('pipeline_type', pipelineType);
    }
    if (stage && stage !== 'ALL') {
      query = query.eq('stage', stage);
    }
    if (loanOfficer && loanOfficer !== 'ALL') {
      query = query.eq('loan_officer_name', loanOfficer);
    }
    if (processor && processor !== 'ALL') {
      query = query.eq('processor_name', processor);
    }
    if (loanType && loanType !== 'ALL') {
      query = query.eq('loan_type', loanType);
    }
    if (transactionType && transactionType !== 'ALL') {
      query = query.eq('transaction_type', transactionType);
    }
    if (search && search.trim() !== '') {
      const q = search.trim();
      query = query.or(`client_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,loan_officer_name.ilike.%${q}%`);
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      loans: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const stageRemarks = body._stage_remarks || null;
    const updatedBy = body._updated_by || 'Mortgage Admin';
    delete body._stage_remarks;
    delete body._updated_by;

    const rawPayload = {
      pipeline_type: body.pipeline_type || 'NEW_LOAN',
      stage: body.stage || (body.pipeline_type === 'PRE_APPROVAL' ? 'PREAPPROVAL_LOAN' : 'NEW_LOAN'),
      client_name: body.client_name,
      phone: body.phone,
      email: body.email,
      address: body.address || null,
      state: body.state || 'CA',
      application_received: body.application_received || 'N',
      application_received_date: body.application_received_date || null,
      inquiry_date: body.inquiry_date || new Date().toISOString().split('T')[0],
      transaction_type: body.transaction_type || 'PURCHASE',
      loan_type: body.loan_type || 'CONVENTIONAL',
      estimated_property_value: body.estimated_property_value,
      estimated_credit_score: body.estimated_credit_score,
      loan_term: body.loan_term || '30_YRS',
      target_closing_date: body.target_closing_date || null,
      loan_officer_name: body.loan_officer_name || 'Kunal Majmundar',
      processor_name: body.processor_name || null,
      all_documents_received: body.all_documents_received || 'N',
      missing_documents_list: body.missing_documents_list || null,
      follow_up_date: body.follow_up_date || null,
      expected_commission: body.expected_commission,
      additional_notes: body.additional_notes || null,
      ...body,
      updated_at: new Date().toISOString(),
    };

    const sanitizedPayload = sanitizePayloadForPostgres(rawPayload);

    const { data, error } = await supabaseServer
      .from('mortgage_loans')
      .insert([sanitizedPayload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const targetStage = (data.stage || 'NEW_LOAN') as StageCode;
    const stageKeys = STAGE_FIELD_GROUPS[targetStage] || [];
    const stageData: Record<string, any> = {};

    for (const key of stageKeys) {
      if (key in data && data[key] !== undefined) {
        stageData[key] = data[key];
      } else {
        stageData[key] = null;
      }
    }

    stageData._stage_name = getStageConfig(targetStage).label;
    stageData._updated_by = updatedBy;
    stageData._updated_at = new Date().toISOString();
    if (stageRemarks) {
      stageData.remarks = stageRemarks;
    }

    try {
      await supabaseServer.from('mortgage_stage_history').insert({
        loan_id: data.id,
        previous_stage: targetStage,
        current_stage: targetStage,
        updated_by: updatedBy,
        remarks: stageRemarks,
        changed_at: new Date().toISOString(),
        stage_data: stageData,
      });
    } catch (historyErr) {
      console.error('Failed to insert initial stage history snapshot:', historyErr);
    }

    return NextResponse.json({
      success: true,
      loan: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
