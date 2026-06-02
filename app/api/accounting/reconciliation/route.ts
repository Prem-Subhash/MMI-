import { NextResponse } from 'next/server'
import { createServer, supabaseServer } from '@/lib/supabaseServer'

export async function GET(req: Request) {
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

    // 3. Fetch leads data from temp_leads_basics
    const { data: leads, error: fetchError } = await supabaseServer
      .from('temp_leads_basics')
      .select('accounting_status, expected_commission, actual_commission')

    if (fetchError) {
      console.error('Fetch reconciliation stats failed:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch reconciliation statistics' }, { status: 500 })
    }

    let reconciledCount = 0
    let discrepancyCount = 0
    let unreconciledCount = 0
    let totalExpectedComm = 0
    let totalActualComm = 0

    if (leads) {
      for (const lead of leads) {
        const status = lead.accounting_status
        if (status === 'reconciled') {
          reconciledCount++
        } else if (status === 'discrepancy') {
          discrepancyCount++
        } else if (status === 'unreconciled' || !status || status === 'Pending Verification') {
          unreconciledCount++
        }

        totalExpectedComm += Number(lead.expected_commission) || 0
        totalActualComm += Number(lead.actual_commission) || 0
      }
    }

    // 4. Return structured JSON response
    return NextResponse.json({
      reconciledCount,
      discrepancyCount,
      unreconciledCount,
      totalExpectedComm,
      totalActualComm
    })
  } catch (error: any) {
    console.error('Fatal reconciliation statistics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
