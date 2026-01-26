import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { leadId, stageId, formData } = await req.json()

    if (!leadId || !stageId) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      )
    }

    /* ================= FETCH STAGE DEFINITION ================= */
    const { data: stage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('mandatory_fields')
      .eq('id', stageId)
      .single()

    if (stageError || !stage) {
      return NextResponse.json(
        { error: 'Invalid stage' },
        { status: 400 }
      )
    }

    const mandatoryFields = stage.mandatory_fields || {}

    /* ================= DEBUG LOGS (TEMPORARY) ================= */
    console.log('UPDATE STAGE REQUEST')
    console.log('Stage ID:', stageId)
    console.log('Mandatory Fields:', mandatoryFields)
    console.log('Form Data:', formData)

    /* ================= SERVER-SIDE VALIDATION (FIXED) ================= */
    for (const key in mandatoryFields) {
      const config = mandatoryFields[key]
      const value = formData?.[key]

      // ✅ Correct validation (DO NOT use !value)
      if (
        config.required &&
        (value === undefined ||
          value === null ||
          value === '')
      ) {
        return NextResponse.json(
          { error: `Missing required field: ${config.label}` },
          { status: 400 }
        )
      }
    }

    /* ================= UPDATE LEAD (FINAL AUTHORITY) ================= */
    const { error: updateError } = await supabase
      .from('temp_leads_basics')
      .update({
        current_stage_id: stageId,
        stage_metadata: formData || {},
      })
      .eq('id', leadId)

    if (updateError) {
      console.error('DB update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Update stage error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
