import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { authenticateApiRequest } from '@/utils/auth'

export async function PATCH(req: Request) {
  try {
    const auth = await authenticateApiRequest(req, ['csr', 'admin', 'superadmin'])
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { historyId, stageMetadata } = await req.json()

    if (!historyId) {
      return NextResponse.json({ error: 'historyId is required' }, { status: 400 })
    }

    if (!stageMetadata || typeof stageMetadata !== 'object') {
      return NextResponse.json({ error: 'Invalid stageMetadata' }, { status: 400 })
    }

    // Backend validation/recalculation for expected commission
    if (stageMetadata.expected_commission_type === 'PERCENTAGE') {
      const premium = Number(stageMetadata.bound_premium || stageMetadata.new_premium || 0)
      const pct = Number(stageMetadata.expected_commission_percentage || 0)
      if (!isNaN(premium) && !isNaN(pct)) {
        stageMetadata.expected_commission = Number(((premium * pct) / 100).toFixed(2))
      }
    }

    // Since lead_stage_history might have strict RLS, we ideally use the service role key to update.
    // In many implementations, Next.js API routes either rely on user RLS or bypass it using supabase-admin.
    // For this, we'll try standard supabase update first, and if RLS fails we would need the service role.
    // Bypass RLS using supabaseServer
    const { data, error } = await supabaseServer
      .from('lead_stage_history')
      .update({ stage_metadata: stageMetadata })
      .eq('id', historyId)
      .select()
      .single()

    // If standard update fails due to RLS, and we must bypass it, we would use the supabaseServer (service role).
    // Let's use the service role key as it's common for audit trails if they are insert-only for users.
    if (error) {
      // Import the server client if needed. We'll stick to the regular client for now, but log the error.
      console.error('Error updating history:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Update History Exception:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
