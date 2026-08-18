import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { STAGE_FIELD_GROUPS, getStageConfig } from '@/app/mortgage/lib/stageFields';
import { StageCode } from '@/app/mortgage/lib/types';
import { authenticateApiRequest } from '@/utils/auth';

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
    const auth = await authenticateApiRequest(request, ['mortgage', 'admin', 'superadmin']);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

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

    const isGlobalView = auth.profile?.role === 'superadmin' || auth.profile?.role === 'admin';
    let query = supabaseServer
      .from('mortgage_loans')
      .select('*, borrowers:mortgage_borrowers(*)', { count: 'exact' });

    if (!isGlobalView) {
      query = query.eq('assigned_mortgage_officer', auth.user.id);
    }

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
    const auth = await authenticateApiRequest(request, ['mortgage', 'admin', 'superadmin']);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const body = await request.json();

    const stageRemarks = body._stage_remarks || null;
    const updatedBy = body._updated_by || auth.user.email || 'Mortgage Officer';
    
    // Extract borrowers array and remove from body to prevent column errors
    const borrowers = body.borrowers || [];
    delete body.borrowers;
    
    delete body._stage_remarks;
    delete body._updated_by;
    delete body.assigned_mortgage_officer; // Never trust frontend

    if (body.pipeline_type === 'PRE_APPROVAL' || body.stage === 'PREAPPROVAL_LOAN') {
      const missing: string[] = [];
      const isMissing = (val: any) => val === undefined || val === null || val === '';
      
      if (isMissing(body.client_name)) missing.push('Primary Client Name');
      if (isMissing(body.phone)) missing.push('Primary Phone Number');
      if (isMissing(body.email)) missing.push('Primary Email Address');
      
      borrowers.forEach((b: any, idx: number) => {
        if (isMissing(b.client_name)) missing.push(`Co-Borrower ${idx} Name`);
      });

      if (isMissing(body.loan_type)) missing.push('Loan Type');
      if (isMissing(body.loan_term)) missing.push('Loan Term');
      if (isMissing(body.estimated_property_value)) missing.push('Estimated Property Value');
      if (isMissing(body.estimated_credit_score)) missing.push('Estimated Credit Score');
      if (isMissing(body.expected_commission)) missing.push('Expected Commission');
      if (isMissing(body.expected_commission_type)) missing.push('Commission Type');
      if (isMissing(body.commission_source)) missing.push('Commission Source');
      if (isMissing(body.loan_officer_name)) missing.push('Assigned Loan Officer');
      if (isMissing(body.processor_name)) missing.push('Assigned Processor');
      if (isMissing(body.state)) missing.push('State');
      if (body.application_received === 'Y' && isMissing(body.application_received_date)) {
        missing.push('Application Received Date');
      }

      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    } else {
      // NEW_LOAN Validation
      const missing: string[] = [];
      const isMissing = (val: any) => val === undefined || val === null || val === '';
      
      if (isMissing(body.client_name)) missing.push('Primary Client Name');
      if (isMissing(body.phone)) missing.push('Primary Phone Number');
      if (isMissing(body.email)) missing.push('Primary Email Address');
      
      borrowers.forEach((b: any, idx: number) => {
        if (isMissing(b.client_name)) missing.push(`Co-Borrower ${idx} Name`);
      });

      if (isMissing(body.expected_commission)) missing.push('Expected Commission');
      if (isMissing(body.expected_commission_type)) missing.push('Commission Type');
      if (isMissing(body.commission_source)) missing.push('Commission Source');

      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    }

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
      transaction_type: body.pipeline_type === 'PRE_APPROVAL' ? 'Pre-approval' : (body.transaction_type || 'PURCHASE'),
      loan_type: body.loan_type || 'CONVENTIONAL',
      estimated_property_value: body.estimated_property_value,
      estimated_credit_score: body.estimated_credit_score,
      loan_term: body.loan_term || '30_YRS',
      target_closing_date: body.target_closing_date || null,
      loan_officer_name: body.loan_officer_name || auth.profile?.full_name || 'Kunal Majmundar',
      processor_name: body.processor_name || null,
      all_documents_received: body.all_documents_received || 'N',
      missing_documents_list: body.missing_documents_list || null,
      follow_up_date: body.follow_up_date || null,
      expected_commission: body.expected_commission,
      additional_notes: body.additional_notes || null,
      ...body,
      street_address: body.pipeline_type === 'PRE_APPROVAL' ? (body.street_address || null) : undefined,
      unit_number: body.pipeline_type === 'PRE_APPROVAL' ? (body.unit_number || null) : undefined,
      city: body.pipeline_type === 'PRE_APPROVAL' ? (body.city || null) : undefined,
      county: body.pipeline_type === 'PRE_APPROVAL' ? (body.county || null) : undefined,
      zip_code: body.pipeline_type === 'PRE_APPROVAL' ? (body.zip_code || null) : undefined,
      assigned_mortgage_officer: body.assigned_mortgage_officer || auth.user.id,
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

    if (borrowers.length > 0) {
      const borrowersPayload = borrowers.map((b: any, idx: number) => ({
        loan_id: data.id,
        client_name: b.client_name,
        phone: b.phone?.trim() || null,
        email: b.email?.trim() || null,
        is_primary: b.is_primary || idx === 0,
        display_order: b.display_order || idx,
      }));
      try {
        await supabaseServer.from('mortgage_borrowers').insert(borrowersPayload);
      } catch (bErr) {
        console.error('Failed to insert borrowers:', bErr);
      }
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
