import { NextResponse } from 'next/server'
import { createServer, supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    // 1. Authenticate user session
    const supabaseSession = await createServer()
    const { data: { user } } = await supabaseSession.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    // 2. Enforce Role-Based Access Control (RBAC)
    const { data: profile } = await supabaseSession
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['accounting', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden. Access restricted to Accounting and Superadmin roles.' }, { status: 403 })
    }

    // 3. Parse and validate request payload
    const body = await req.json()
    const {
      leadId,
      actualCommission,
      accountingStatus,
      accountingVerified,
      accountingNotes,
      carrierPaymentDate,
      commissionReceivedDate
    } = body

    if (!leadId) {
      return NextResponse.json({ error: 'Missing required field: leadId' }, { status: 400 })
    }

    if (actualCommission !== undefined && typeof actualCommission !== 'number') {
      return NextResponse.json({ error: 'actualCommission must be a number' }, { status: 400 })
    }

    const validStatuses = ['unreconciled', 'reconciled', 'discrepancy']
    if (accountingStatus && !validStatuses.includes(accountingStatus)) {
      return NextResponse.json({ error: 'Invalid accountingStatus value' }, { status: 400 })
    }

    if (accountingVerified !== undefined && typeof accountingVerified !== 'boolean') {
      return NextResponse.json({ error: 'accountingVerified must be a boolean' }, { status: 400 })
    }

    // 4. Fetch current lead state to log differences (Audit Logging)
    const { data: currentLead, error: fetchError } = await supabaseServer
      .from('temp_leads_basics')
      .select(`
        expected_commission,
        actual_commission,
        accounting_status,
        accounting_verified,
        accounting_notes,
        verified_by,
        verified_at,
        carrier_payment_date,
        commission_received_date
      `)
      .eq('id', leadId)
      .single()

    if (fetchError || !currentLead) {
      console.error('Fetch lead failed:', fetchError)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 5. Build dynamic update payload
    const updatePayload: any = {}
    if (actualCommission !== undefined) updatePayload.actual_commission = actualCommission
    if (accountingStatus !== undefined) updatePayload.accounting_status = accountingStatus
    if (accountingVerified !== undefined) {
      updatePayload.accounting_verified = accountingVerified
      if (accountingVerified) {
        updatePayload.verified_by = user.id
        updatePayload.verified_at = new Date().toISOString()
      } else {
        updatePayload.verified_by = null
        updatePayload.verified_at = null
      }
    }
    if (accountingNotes !== undefined) updatePayload.accounting_notes = accountingNotes
    if (carrierPaymentDate !== undefined) updatePayload.carrier_payment_date = carrierPaymentDate || null
    if (commissionReceivedDate !== undefined) updatePayload.commission_received_date = commissionReceivedDate || null

    // 6. Update database record (bypasses RLS for system mutation)
    const { error: updateError } = await supabaseServer
      .from('temp_leads_basics')
      .update(updatePayload)
      .eq('id', leadId)

    if (updateError) {
      console.error('Update lead failed:', updateError)
      return NextResponse.json({ error: 'Failed to update policy verification status' }, { status: 500 })
    }

    // 7. Insert Audit Logs into accounting_logs
    const newActualCommission = updatePayload.actual_commission !== undefined ? updatePayload.actual_commission : currentLead.actual_commission
    const newStatus = updatePayload.accounting_status !== undefined ? updatePayload.accounting_status : currentLead.accounting_status
    const logNotes = updatePayload.accounting_notes !== undefined ? updatePayload.accounting_notes : currentLead.accounting_notes

    const { error: logError } = await supabaseServer
      .from('accounting_logs')
      .insert({
        lead_id: leadId,
        updated_by: user.id,
        old_expected_commission: currentLead.expected_commission,
        new_expected_commission: currentLead.expected_commission, // verify-policy doesn't change expected commission
        old_actual_commission: currentLead.actual_commission,
        new_actual_commission: newActualCommission,
        old_status: currentLead.accounting_status,
        new_status: newStatus,
        notes: logNotes,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Failed to write audit logs to accounting_logs:', logError)
      // Do not block response since database update was completed successfully
    }

    return NextResponse.json({ success: true, message: 'Policy verification status updated successfully.' })
  } catch (error: any) {
    console.error('Fatal verify policy API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
