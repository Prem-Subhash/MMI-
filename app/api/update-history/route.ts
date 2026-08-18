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

    // Fetch current history record to get lead_id and stage_name before modifying
    const { data: currentHistory, error: fetchError } = await supabaseServer
      .from('lead_stage_history')
      .select('lead_id, stage_name')
      .eq('id', historyId)
      .single()

    if (fetchError || !currentHistory) {
      return NextResponse.json({ error: 'History record not found' }, { status: 404 })
    }

    const leadId = currentHistory.lead_id
    const stageName = currentHistory.stage_name

    // Backend validation/recalculation for expected commission (legacy fallback)
    if (stageMetadata.expected_commission_type === 'PERCENTAGE') {
      const premium = Number(stageMetadata.bound_premium || stageMetadata.new_premium || 0)
      const pct = Number(stageMetadata.expected_commission_percentage || 0)
      if (!isNaN(premium) && !isNaN(pct)) {
        stageMetadata.expected_commission = Number(((premium * pct) / 100).toFixed(2))
      }
    }

    /* ================= PHASE 2C RECALCULATION ================= */
    let syncPayload: any = {}
    const completionStages = ['Completed', 'Policy Bound', 'Completed (Same)', 'Completed (Switch)']
    if (completionStages.includes(stageName)) {
      // Fetch the lead's locked percentages
      const { data: leadData } = await supabaseServer.from('temp_leads_basics').select('locked_carrier_percent, locked_referral_percent').eq('id', leadId).single()
      
      // If legacy lead (locked_carrier_percent IS NULL), we bypass Phase 2C engine
      if (leadData && leadData.locked_carrier_percent !== null && leadData.locked_carrier_percent !== undefined) {
         const authoritativePremium = stageName === 'Completed (Switch)' ? stageMetadata.new_premium : stageMetadata.bound_premium
         
         if (authoritativePremium !== undefined && authoritativePremium !== null && Number(authoritativePremium) > 0) {
           const { calculateCommissionSplit } = await import('@/utils/commissionEngine')
           const financialSplit = calculateCommissionSplit({
             premium: Number(authoritativePremium),
             carrier_percent: Number(leadData.locked_carrier_percent),
             referral_percent: leadData.locked_referral_percent !== null && leadData.locked_referral_percent !== undefined ? Number(leadData.locked_referral_percent) : null
           })
           
           syncPayload.gross_commission = financialSplit.gross_commission
           syncPayload.admin_charge = financialSplit.admin_charge
           syncPayload.net_commission = financialSplit.net_commission
           syncPayload.referral_payout = financialSplit.referral_payout
           syncPayload.company_commission = financialSplit.company_commission
           syncPayload.expected_commission = financialSplit.gross_commission
           
           if (stageName === 'Completed (Switch)') {
               syncPayload.new_premium = authoritativePremium
           } else {
               syncPayload.total_premium = authoritativePremium
           }
           
           stageMetadata.expected_commission = financialSplit.gross_commission
           stageMetadata.gross_commission = financialSplit.gross_commission
         }
      }
    }

    // Bypass RLS using supabaseServer
    const { data, error } = await supabaseServer
      .from('lead_stage_history')
      .update({ stage_metadata: stageMetadata })
      .eq('id', historyId)
      .select()
      .single()

    if (error) {
      console.error('Error updating history:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Sync metadata changes to temp_leads_basics
    if (data?.lead_id) {
      if (stageMetadata.insurance_company_id) {
        syncPayload.insurance_company_id = stageMetadata.insurance_company_id
      }
      if (stageMetadata.new_carrier) {
        syncPayload.new_carrier = stageMetadata.new_carrier
      } else if (stageMetadata.carrier) {
        syncPayload.carrier = stageMetadata.carrier
      }

      if (Object.keys(syncPayload).length > 0) {
        await supabaseServer
          .from('temp_leads_basics')
          .update(syncPayload)
          .eq('id', data.lead_id)
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('Update History Exception:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
