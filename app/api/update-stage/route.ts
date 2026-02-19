import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { leadId, stageId, stageMetadata } = await req.json()

    if (!leadId || !stageId) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      )
    }

    /* ================= FETCH LEAD ================= */
    const { data: lead, error: leadError } = await supabaseServer
      .from('temp_leads_basics')
      .select('id, stage_metadata, effective_date, renewal_date')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Invalid lead' },
        { status: 404 }
      )
    }

    /* ================= FETCH STAGE ================= */
    const { data: stage, error: stageError } = await supabaseServer
      .from('pipeline_stages')
      .select(`
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

    // If mandatoryFields is an array (JSONB), convert to simple check
    // If it's an object (legacy/compat), iterate keys
    const fieldsToCheck = Array.isArray(mandatoryFields)
      ? mandatoryFields
      : Object.keys(mandatoryFields)

    for (const key of fieldsToCheck) {
      // In array format, key is the field name itself
      // In object format, key is field name
      const fieldName = key
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

    // 2. Commercial Lines - Required Documents Check
    if (stage.stage_name === 'Quoting in Progress') {
      // mergedMetadata.required_documents_received should be a boolean true if checkbox/dropdown was Yes
      if (mergedMetadata.required_documents_received !== true) {
        return NextResponse.json(
          { error: 'You must receive all required documents before proceeding.' },
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
      stage_metadata: mergedMetadata,
    }

    // "Set reminder_sent = false for renewal automation" if Completed
    if (stage.stage_name === 'Completed') {
      updatePayload.reminder_sent = false
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

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
