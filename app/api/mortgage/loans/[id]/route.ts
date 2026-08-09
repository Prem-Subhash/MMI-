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
    'second_appraisal_request_date',
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
    'second_appraisal_value',
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateApiRequest(request, ['mortgage', 'admin', 'superadmin']);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { id } = await params;
    const isGlobalView = auth.profile?.role === 'superadmin' || auth.profile?.role === 'admin';
      let query = supabaseServer
      .from('mortgage_loans')
      .select('*, borrowers:mortgage_borrowers(*)')
      .eq('id', id);

    if (!isGlobalView) {
      query = query.eq('assigned_mortgage_officer', auth.user.id);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Unauthorized or Loan not found' }, { status: 404 });
    }

    let historyData = [];
    try {
      const { data: h } = await supabaseServer
        .from('mortgage_stage_history')
        .select('*')
        .eq('loan_id', id)
        .order('changed_at', { ascending: false });
      if (h) historyData = h;
    } catch (hErr) {}

    return NextResponse.json({ success: true, loan: data, history: historyData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateApiRequest(request, ['mortgage', 'admin', 'superadmin']);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const stageRemarks = body._stage_remarks || null;
    const categorizedRemarks = body._categorized_remarks || null;
    const updatedBy = body._updated_by || auth.user.email || 'Mortgage Officer';
    
    const borrowers = body.borrowers;
    delete body.borrowers;
    
    delete body._stage_remarks;
    delete body._categorized_remarks;
    delete body._updated_by;

    // Prevent overwriting immutable primary key or ownership
    delete body.id;
    delete body.created_at;
    const isGlobalView = auth.profile?.role === 'superadmin' || auth.profile?.role === 'admin';
    if (!isGlobalView) {
      delete body.assigned_mortgage_officer;
    }

    let checkQuery = supabaseServer
      .from('mortgage_loans')
      .select('*')
      .eq('id', id);

    if (!isGlobalView) {
      checkQuery = checkQuery.eq('assigned_mortgage_officer', auth.user.id);
    }

    const { data: currentLoan, error: checkError } = await checkQuery.single();

    if (checkError || !currentLoan) {
      return NextResponse.json({ error: 'Unauthorized or Loan not found' }, { status: 404 });
    }

    if (currentLoan.pipeline_type === 'PRE_APPROVAL' || currentLoan.stage === 'PREAPPROVAL_LOAN') {
      const mergedPayload = { ...currentLoan, ...body };
      const missing: string[] = [];
      const isMissing = (val: any) => val === undefined || val === null || val === '';

      if (isMissing(mergedPayload.client_name)) missing.push('Primary Client Name');
      if (isMissing(mergedPayload.phone)) missing.push('Primary Phone Number');
      if (isMissing(mergedPayload.email)) missing.push('Primary Email Address');
      
      borrowers.forEach((b: any, idx: number) => {
        if (isMissing(b.client_name)) missing.push(`Co-Borrower ${idx} Name`);
      });
      if (isMissing(mergedPayload.loan_type)) missing.push('Loan Type');
      if (isMissing(mergedPayload.loan_term)) missing.push('Loan Term');
      if (isMissing(mergedPayload.estimated_property_value)) missing.push('Estimated Property Value');
      if (isMissing(mergedPayload.estimated_credit_score)) missing.push('Estimated Credit Score');
      if (isMissing(mergedPayload.expected_commission)) missing.push('Expected Commission');
      if (isMissing(mergedPayload.expected_commission_type)) missing.push('Commission Type');
      if (isMissing(mergedPayload.commission_source)) missing.push('Commission Source');
      if (isMissing(mergedPayload.loan_officer_name)) missing.push('Assigned Loan Officer');
      if (isMissing(mergedPayload.processor_name)) missing.push('Assigned Processor');
      if (isMissing(mergedPayload.state)) missing.push('State');
      if (mergedPayload.application_received === 'Y' && isMissing(mergedPayload.application_received_date)) {
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
      const mergedPayload = { ...currentLoan, ...body };
      const missing: string[] = [];
      const isMissing = (val: any) => val === undefined || val === null || val === '';
      
      if (isMissing(mergedPayload.client_name)) missing.push('Primary Client Name');
      if (isMissing(mergedPayload.phone)) missing.push('Primary Phone Number');
      if (isMissing(mergedPayload.email)) missing.push('Primary Email Address');
      
      borrowers.forEach((b: any, idx: number) => {
        if (isMissing(b.client_name)) missing.push(`Co-Borrower ${idx} Name`);
      });

      if (isMissing(mergedPayload.expected_commission)) missing.push('Expected Commission');
      if (isMissing(mergedPayload.expected_commission_type)) missing.push('Commission Type');
      if (isMissing(mergedPayload.commission_source)) missing.push('Commission Source');

      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const targetStageForValidation = body.stage || currentLoan?.stage || 'NEW_LOAN';
    if (targetStageForValidation === 'FINAL_COMPLIANCE') {
      const mergedPayload = { ...currentLoan, ...body };
      const missing: string[] = [];
      const isMissing = (val: any) => val === undefined || val === null || val === '';
      
      const requiredFields = [
        'moonstar_disclosure_2_signed',
        'appraisal_sent_to_client',
        'cd_requested',
        'ctc_status',
        'cd_acknowledged',
        'closing_confirmation_received',
        'voe_cleared',
        'second_appraisal_required'
      ];

      requiredFields.forEach(f => {
        if (isMissing(mergedPayload[f])) missing.push(f);
      });

      if (mergedPayload.moonstar_disclosure_2_signed === 'Y' && isMissing(mergedPayload.moonstar_disclosure_2_signed_date)) {
         missing.push('moonstar_disclosure_2_signed_date');
      }
      if (mergedPayload.appraisal_sent_to_client === 'Y' && isMissing(mergedPayload.appraisal_sent_date)) {
         missing.push('appraisal_sent_date');
      }

      if (mergedPayload.second_appraisal_required === 'Y') {
        ['second_appraisal_request_date', 'second_appraisal_value', 'second_appraisal_resolution_desc', 'second_appraisal_sent_to_client'].forEach(f => {
          if (isMissing(mergedPayload[f])) missing.push(f);
        });
      }

      if (missing.length > 0) {
        return NextResponse.json(
          { error: `Missing required fields for Final Compliance: ${missing.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const rawPayload: any = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    if (currentLoan.pipeline_type === 'PRE_APPROVAL') {
      rawPayload.transaction_type = 'Pre-approval';
    }

    const sanitizedPayload = sanitizePayloadForPostgres(rawPayload);

    let updateQuery = supabaseServer
      .from('mortgage_loans')
      .update(sanitizedPayload)
      .eq('id', id);

    if (!isGlobalView) {
      updateQuery = updateQuery.eq('assigned_mortgage_officer', auth.user.id);
    }

    const { data, error } = await updateQuery.select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Replace borrowers using delete-and-reinsert strategy
    if (borrowers && Array.isArray(borrowers)) {
      try {
        await supabaseServer.from('mortgage_borrowers').delete().eq('loan_id', id);
        if (borrowers.length > 0) {
          const borrowersPayload = borrowers.map((b: any, idx: number) => ({
            loan_id: id,
            client_name: b.client_name,
            phone: b.phone?.trim() || null,
            email: b.email?.trim() || null,
            is_primary: b.is_primary || idx === 0,
            display_order: b.display_order || idx,
          }));
          await supabaseServer.from('mortgage_borrowers').insert(borrowersPayload);
        }
      } catch (bErr) {
        console.error('Failed to sync borrowers:', bErr);
      }
    }

    const targetStage = (data.stage || currentLoan?.stage || 'NEW_LOAN') as StageCode;
    const prevStage = currentLoan?.stage || targetStage;
    const stageKeys = STAGE_FIELD_GROUPS[targetStage] || [];
    const stageData: Record<string, any> = {};

    for (const key of stageKeys) {
      if (key in data && data[key] !== undefined) {
        stageData[key] = data[key];
      } else if (currentLoan && key in currentLoan && currentLoan[key] !== undefined) {
        stageData[key] = currentLoan[key];
      } else {
        stageData[key] = null;
      }
    }

    stageData._stage_name = getStageConfig(targetStage).label;
    stageData._updated_by = updatedBy;
    stageData._updated_at = new Date().toISOString();
    if (targetStage === 'FINAL_COMPLIANCE' && categorizedRemarks) {
      stageData.categorized_remarks = categorizedRemarks;
    }
    if (stageRemarks) {
      stageData.remarks = stageRemarks;
    }

    try {
      await supabaseServer.from('mortgage_stage_history').insert({
        loan_id: id,
        previous_stage: prevStage,
        current_stage: targetStage,
        updated_by: updatedBy,
        remarks: stageRemarks,
        changed_at: new Date().toISOString(),
        stage_data: stageData,
      });
    } catch (historyErr) {
      console.error('Failed to record stage history snapshot:', historyErr);
    }

    return NextResponse.json({ success: true, loan: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateApiRequest(request, ['mortgage', 'admin', 'superadmin']);
    if (auth.error || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status || 401 });
    }

    const { id } = await params;
    const isGlobalView = auth.profile?.role === 'superadmin' || auth.profile?.role === 'admin';
    let checkQuery = supabaseServer
      .from('mortgage_loans')
      .select('id')
      .eq('id', id);

    if (!isGlobalView) {
      checkQuery = checkQuery.eq('assigned_mortgage_officer', auth.user.id);
    }

    const { data: existingLoan, error: checkError } = await checkQuery.single();

    if (checkError || !existingLoan) {
      return NextResponse.json({ error: 'Unauthorized or Loan not found' }, { status: 404 });
    }

    let deleteQuery = supabaseServer
      .from('mortgage_loans')
      .delete()
      .eq('id', id);

    if (!isGlobalView) {
      deleteQuery = deleteQuery.eq('assigned_mortgage_officer', auth.user.id);
    }

    const { error } = await deleteQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
