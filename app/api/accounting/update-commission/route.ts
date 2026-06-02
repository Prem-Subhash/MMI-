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
    const { leadId, expectedCommission, actualCommission } = body

    if (!leadId) {
      return NextResponse.json({ error: 'Missing required field: leadId' }, { status: 400 })
    }

    if (expectedCommission === undefined || typeof expectedCommission !== 'number' || isNaN(expectedCommission)) {
      return NextResponse.json({ error: 'expectedCommission is required and must be a valid number' }, { status: 400 })
    }

    if (actualCommission === undefined || typeof actualCommission !== 'number' || isNaN(actualCommission)) {
      return NextResponse.json({ error: 'actualCommission is required and must be a valid number' }, { status: 400 })
    }

    if (expectedCommission < 0 || actualCommission < 0) {
      return NextResponse.json({ error: 'Commission values cannot be negative' }, { status: 400 })
    }

    // 4. Fetch current lead state to log differences (Audit Logging)
    const { data: currentLead, error: fetchError } = await supabaseServer
      .from('temp_leads_basics')
      .select('expected_commission, actual_commission, accounting_status')
      .eq('id', leadId)
      .single()

    if (fetchError || !currentLead) {
      console.error('Fetch lead failed:', fetchError)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 5. Update expected_commission and actual_commission in temp_leads_basics
    const { error: updateError } = await supabaseServer
      .from('temp_leads_basics')
      .update({
        expected_commission: expectedCommission,
        actual_commission: actualCommission
      })
      .eq('id', leadId)

    if (updateError) {
      console.error('Update lead commissions failed:', updateError)
      return NextResponse.json({ error: 'Failed to update commission values' }, { status: 500 })
    }

    // 6. Insert Audit Log into accounting_logs
    const { error: logError } = await supabaseServer
      .from('accounting_logs')
      .insert({
        lead_id: leadId,
        updated_by: user.id,
        old_expected_commission: currentLead.expected_commission,
        new_expected_commission: expectedCommission,
        old_actual_commission: currentLead.actual_commission,
        new_actual_commission: actualCommission,
        old_status: currentLead.accounting_status,
        new_status: currentLead.accounting_status,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Failed to write audit logs to accounting_logs:', logError)
      // Do not block response since database update was completed successfully
    }

    return NextResponse.json({ success: true, message: 'Commission values updated successfully.' })
  } catch (error: any) {
    console.error('Fatal update commission API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
