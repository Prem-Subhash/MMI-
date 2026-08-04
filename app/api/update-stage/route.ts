import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { authenticateApiRequest, authorizeLeadAccess } from '@/utils/auth'

export async function POST(req: Request) {
  try {
    const auth = await authenticateApiRequest(req, ['csr', 'admin', 'superadmin'])
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { leadId, stageId, stageMetadata } = await req.json()

    if (!leadId || !stageId) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      )
    }

    /* ================= AUTHORIZE & FETCH LEAD ================= */
    const authLead = await authorizeLeadAccess(auth.profile, leadId)
    if (!authLead.authorized || !authLead.lead) {
      return NextResponse.json(
        { error: authLead.error || 'Invalid lead' },
        { status: authLead.status || 404 }
      )
    }
    const lead = authLead.lead

    /* ================= FETCH STAGE ================= */
    const { data: stage, error: stageError } = await supabaseServer
      .from('pipeline_stages')
      .select(`
        id,
        stage_name, 
        mandatory_fields, 
        pipeline_id,
        pipelines (
          category,
          is_renewal
        )
      `)
      .eq('id', stageId)
      .single()

    if (stageError || !stage) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      )
    }

    const mandatoryFields = stage.mandatory_fields || {}

    const mergedMetadata = {
      ...(lead.stage_metadata || {}),
      ...(stageMetadata || {}),
    }

    /* ================= MANDATORY CHECKLIST VALIDATION ================= */
    const missingFields: string[] = []

    if (stage.stage_name === 'Completed (Switch)') {
      // Enforce mandatory fields for Completed (Switch) stage transition
      if (!mergedMetadata.new_carrier || mergedMetadata.new_carrier.toString().trim() === '') {
        missingFields.push('new_carrier')
      }
      if (!mergedMetadata.new_policy_number || mergedMetadata.new_policy_number.toString().trim() === '') {
        missingFields.push('new_policy_number')
      }
      if (mergedMetadata.new_premium === undefined || mergedMetadata.new_premium === null || mergedMetadata.new_premium === '') {
        missingFields.push('new_premium')
      }
    }

    // If mandatoryFields is an array (JSONB), convert to simple check
    // If it's an object (legacy/compat), iterate keys
    const fieldsToCheck = Array.isArray(mandatoryFields)
      ? mandatoryFields
      : Object.keys(mandatoryFields)

    // Globally optional fields that should never block stage updates, even if present in the database configuration
    const globallyOptionalFields = ['notes', 'details', 'x_date']

    for (const key of fieldsToCheck) {
      // In array format, key is the field name itself
      // In object format, key is field name
      const fieldName = key
      
      if (globallyOptionalFields.includes(fieldName.toLowerCase())) {
        continue
      }

      // If stage is Completed (Switch), and legacy checklist asks for policy_number or bound_premium,
      // alias to new_policy_number or new_premium so it doesn't fail
      if (stage.stage_name === 'Completed (Switch)' && (fieldName === 'policy_number' || fieldName === 'bound_premium')) {
        continue
      }

      const fieldConfig = !Array.isArray(mandatoryFields) ? mandatoryFields[key] : { required: true }

      const value = mergedMetadata[fieldName]

      if (
        (fieldConfig?.required !== false) && // Default to required if not specified
        (value === undefined || value === null || value === '')
      ) {
        missingFields.push(fieldName)
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required checklist fields',
          missingFields,
        },
        { status: 400 }
      )
    }

    /* ================= DATE VALIDATION ================= */
    if (stageMetadata?.target_completion_date) {
      const selectedDate = new Date(stageMetadata.target_completion_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        return NextResponse.json(
          { error: 'Backdated target completion date is not allowed' },
          { status: 400 }
        )
      }
    }


    /* ================= BUSINESS RULES ================= */

    // 1. Personal Lines - Quote Sent Email Check
    if (stage.stage_name === 'Quote Has Been Emailed') {
      const emailAlreadySent =
        lead.stage_metadata?.email_sent === true ||
        mergedMetadata.email_sent === true

      if (!emailAlreadySent) {
        return NextResponse.json(
          {
            error:
              'Initial email must be sent before moving to this stage',
          },
          { status: 400 }
        )
      }
    }

    // 2. Business Rules - Required Documents Validation
    if (stage.stage_name === 'Quoting in Progress') {
      // Commercial pipelines
      if (
        fieldsToCheck.includes('required_documents_received') &&
        mergedMetadata.required_documents_received !== true
      ) {
        return NextResponse.json(
          { error: 'You must receive all required documents before proceeding.' },
          { status: 400 }
        )
      }

      // Personal pipelines
      if (
        fieldsToCheck.includes('info_received') &&
        mergedMetadata.info_received !== true
      ) {
        return NextResponse.json(
          { error: 'You must receive all required information before proceeding.' },
          { status: 400 }
        )
      }
    }

    /* ================= AUTOMATION: X-DATE CALCULATION ================= */
    const isCommercialCompleted = stage.stage_name === 'Completed'
    const isCommercialDidNotBind = stage.stage_name === 'Did Not Bind'

    if (isCommercialCompleted || isCommercialDidNotBind) {
      // "Automatically calculate X-Date = Renewal Date - 60 days"
      // Assumption: Renewal Date = Effective Date + 1 Year
      // If effective_date is missing, we can't calculate.

      let renewalDate: Date | null = null

      if (lead.effective_date) {
        const effDate = new Date(lead.effective_date)
        // Add 1 year
        effDate.setFullYear(effDate.getFullYear() + 1)
        renewalDate = effDate
      } else if (stageMetadata?.effective_date) {
        // Fallback if provided in metadata (not standard but possible)
        const effDate = new Date(stageMetadata.effective_date)
        effDate.setFullYear(effDate.getFullYear() + 1)
        renewalDate = effDate
      }

      if (renewalDate) {
        // Subtract 60 days
        const xDate = new Date(renewalDate)
        xDate.setDate(xDate.getDate() - 60)

        mergedMetadata.x_date = xDate.toISOString().split('T')[0]
      }
    }

    /* ================= AUTOMATION: X-DATE CALCULATION (Commercial Renewal) ================= */
    // Helper to safely access array or object for pipeline
    const pipelineData = Array.isArray(stage.pipelines) ? stage.pipelines[0] : stage.pipelines

    const isCommercialRenewal =
      pipelineData?.is_renewal === true &&
      pipelineData?.category === 'Commercial Lines'

    const targetStages = ['Completed (Same)', 'Completed (Switch)', 'Cancelled']

    if (isCommercialRenewal && targetStages.includes(stage.stage_name)) {
      const renewalDateStr = lead.renewal_date

      if (!renewalDateStr) {
        return NextResponse.json(
          { error: 'Renewal Date is missing. Cannot calculate X-Date.' },
          { status: 400 }
        )
      }

      // X-Date = Renewal Date - 60 Days
      const rDate = new Date(renewalDateStr)
      rDate.setDate(rDate.getDate() - 60)

      mergedMetadata.x_date = rDate.toISOString().split('T')[0]
    }


    /* ================= UPDATE LEAD ================= */
    const updatePayload: any = {
      current_stage_id: stageId,
      current_stage: stage.stage_name,
      stage_metadata: mergedMetadata,
    }

    // "Set reminder_sent = false for renewal automation" if Completed
    if (stage.stage_name === 'Completed') {
      updatePayload.reminder_sent = false
    }

    /* ================= ACCOUNTING INTEGRATION ================= */
    const completionStages = ['Completed', 'Policy Bound', 'Completed (Same)']
    if (completionStages.includes(stage.stage_name)) {
      let boundPremium = stageMetadata?.bound_premium !== undefined ? stageMetadata.bound_premium : mergedMetadata.bound_premium

      // Fallback to renewal_premium for Completed (Same) where bound_premium is not defined in metadata
      if ((boundPremium === undefined || boundPremium === null || boundPremium === '') && lead.renewal_premium !== undefined && lead.renewal_premium !== null) {
        boundPremium = lead.renewal_premium
      }

      // Enforce backend percentage calculation
      if (stageMetadata?.expected_commission_type === 'PERCENTAGE') {
        const premium = Number(boundPremium)
        const pct = Number(stageMetadata.expected_commission_percentage)
        if (!isNaN(premium) && !isNaN(pct)) {
           stageMetadata.expected_commission = Number(((premium * pct) / 100).toFixed(2))
        }
      }

      const expectedCommission = stageMetadata?.expected_commission !== undefined ? stageMetadata.expected_commission : mergedMetadata.expected_commission

      if (boundPremium !== undefined && boundPremium !== null && boundPremium !== '') {
        const val = Number(boundPremium)
        if (!isNaN(val)) {
          if (val < 0) {
            return NextResponse.json({ error: 'Premium value cannot be negative' }, { status: 400 })
          }
          updatePayload.total_premium = val
        }
      }

      if (expectedCommission !== undefined && expectedCommission !== null && expectedCommission !== '') {
        const val = Number(expectedCommission)
        if (!isNaN(val)) {
          if (val < 0) {
            return NextResponse.json({ error: 'Commission value cannot be negative' }, { status: 400 })
          }
          updatePayload.expected_commission = val
        }
      }

      const policyNumber = stageMetadata?.policy_number !== undefined ? stageMetadata.policy_number : mergedMetadata.policy_number
      if (policyNumber !== undefined && policyNumber !== null) {
        updatePayload.policy_number = String(policyNumber)
      }

      const carrierVal = stageMetadata?.carrier !== undefined ? stageMetadata.carrier : mergedMetadata.carrier
      if (carrierVal !== undefined && carrierVal !== null) {
        updatePayload.carrier = String(carrierVal)
      }
    } else if (stage.stage_name === 'Completed (Switch)') {
      // Dedicated handling for Completed (Switch) to populate new active policy columns
      // while NEVER overwriting original base columns (carrier, policy_number, total_premium/current_premium).
      const newCarrier = stageMetadata?.new_carrier !== undefined ? stageMetadata.new_carrier : mergedMetadata.new_carrier
      const newPolicyNum = stageMetadata?.new_policy_number !== undefined ? stageMetadata.new_policy_number : mergedMetadata.new_policy_number
      const newPremium = stageMetadata?.new_premium !== undefined ? stageMetadata.new_premium : mergedMetadata.new_premium

      // Enforce backend percentage calculation
      if (stageMetadata?.expected_commission_type === 'PERCENTAGE') {
        const premium = Number(newPremium)
        const pct = Number(stageMetadata.expected_commission_percentage)
        if (!isNaN(premium) && !isNaN(pct)) {
           stageMetadata.expected_commission = Number(((premium * pct) / 100).toFixed(2))
        }
      }

      const expectedCommission = stageMetadata?.expected_commission !== undefined ? stageMetadata.expected_commission : mergedMetadata.expected_commission

      if (newCarrier !== undefined && newCarrier !== null && newCarrier.toString().trim() !== '') {
        updatePayload.new_carrier = String(newCarrier).trim()
      } else {
        return NextResponse.json({ error: 'New Carrier Name is required for Completed (Switch)' }, { status: 400 })
      }

      if (newPolicyNum !== undefined && newPolicyNum !== null && newPolicyNum.toString().trim() !== '') {
        updatePayload.new_policy_number = String(newPolicyNum).trim()
      } else {
        return NextResponse.json({ error: 'New Policy Number is required for Completed (Switch)' }, { status: 400 })
      }

      if (newPremium !== undefined && newPremium !== null && newPremium !== '') {
        const val = Number(newPremium)
        if (!isNaN(val)) {
          if (val < 0) {
            return NextResponse.json({ error: 'New Premium value cannot be negative' }, { status: 400 })
          }
          updatePayload.new_premium = val
        } else {
          return NextResponse.json({ error: 'New Premium must be a valid number' }, { status: 400 })
        }
      } else {
        return NextResponse.json({ error: 'New Bound Premium is required for Completed (Switch)' }, { status: 400 })
      }

      if (expectedCommission !== undefined && expectedCommission !== null && expectedCommission !== '') {
        const val = Number(expectedCommission)
        if (!isNaN(val)) {
          if (val < 0) {
            return NextResponse.json({ error: 'Commission value cannot be negative' }, { status: 400 })
          }
          updatePayload.expected_commission = val
        }
      }
    }

    const { error: updateError } = await supabaseServer
      .from('temp_leads_basics')
      .update(updatePayload)
      .eq('id', leadId)

    if (updateError) {
      console.error(updateError)
      return NextResponse.json(
        { error: 'Failed to update stage' },
        { status: 500 }
      )
    }

    // Insert history snapshot after successful update
    // We store the EXACT payload received from the form as a snapshot
    const { error: historyError } = await supabaseServer
      .from('lead_stage_history')
      .insert([
        {
          lead_id: lead.id,
          stage_id: stage.id,
          stage_name: stage.stage_name,
          stage_metadata: stageMetadata,
        },
      ])

    if (historyError) {
      console.error('Stage history insertion failed:', historyError)
      // Proceed returning success since primary update succeeded
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
