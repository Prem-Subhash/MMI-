import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { authenticateApiRequest } from '@/utils/auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateApiRequest(req, ['lending', 'accurate_lending', 'admin', 'superadmin'])
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { stageName, stageMetadata, remarks } = await req.json()
    const { id } = await params
    const loanId = id

    if (!stageName) {
      return NextResponse.json({ error: 'Missing stageName' }, { status: 400 })
    }

    // 1. Fetch current loan to get previous stage
    const { data: loan, error: loanError } = await supabaseServer
      .from('accurate_lending_loans')
      .select('current_stage')
      .eq('id', loanId)
      .single()

    if (loanError || !loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    const previousStage = loan.current_stage

    // 2. Update loan current_stage
    const { error: updateError } = await supabaseServer
      .from('accurate_lending_loans')
      .update({
        current_stage: stageName,
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId)

    if (updateError) {
      console.error('Update Error:', updateError)
      return NextResponse.json({ error: 'Failed to update loan stage' }, { status: 500 })
    }

    // 3. Insert into stage history
    const { error: historyError } = await supabaseServer
      .from('accurate_lending_stage_history')
      .insert({
        loan_id: loanId,
        previous_stage: previousStage,
        current_stage: stageName,
        updated_by: auth.profile.id,
        remarks: remarks || null,
        stage_data: stageMetadata || {}
      })

    if (historyError) {
      console.error('History Error:', historyError)
      // Even if history fails, the stage update succeeded
    }

    return NextResponse.json({ success: true, current_stage: stageName })
  } catch (err) {
    console.error('Lending Update Stage Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
