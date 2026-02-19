import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendGraphEmail } from '@/lib/microsoftGraph'

export async function POST(req: Request) {
  try {
    const { leadId, templateId, formType } = await req.json()

    console.log('SEND EMAIL API HIT:', { leadId, templateId, formType })

    if (!leadId || !templateId || !formType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    /* ================= FETCH LEAD ================= */
    const { data: lead, error: leadError } = await supabaseServer
      .from('temp_leads_basics')
      .select('id, client_name, email, stage_metadata')
      .eq('id', leadId)
      .single()

    if (leadError || !lead || !lead.email) {
      console.error('LEAD FETCH ERROR:', leadError)
      return NextResponse.json(
        { error: 'Invalid lead or missing email' },
        { status: 404 }
      )
    }

    /* ================= FETCH EMAIL TEMPLATE ================= */
    const { data: template, error: templateError } = await supabaseServer
      .from('email_templates')
      .select('id, subject, body')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      console.error('TEMPLATE FETCH ERROR:', templateError)
      return NextResponse.json(
        { error: 'Email template not found or inactive' },
        { status: 404 }
      )
    }

    /* ================= GENERATE FORM LINK ================= */
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_SITE_URL not configured' },
        { status: 500 }
      )
    }

    const formLink = `${baseUrl}/intake/${leadId}?type=${formType}`

    /* ================= PREPARE EMAIL BODY ================= */
    const emailBody = template.body
      .replace(/{{\s*client_name\s*}}/g, lead.client_name || '')
      .replace(/{{\s*form_link\s*}}/g, formLink)

    /* ================= SEND EMAIL (MS GRAPH) ================= */
    try {
      await sendGraphEmail([lead.email], template.subject, emailBody)
      console.log('EMAIL SENT SUCCESSFULLY VIA GRAPH API')
    } catch (emailError: any) {
      console.error('FAILED TO SEND EMAIL VIA GRAPH:', emailError)
      return NextResponse.json(
        { error: `Email send failed: ${emailError.message}` },
        { status: 500 }
      )
    }

    /* ================= OPTIONAL EMAIL LOG ================= */
    const { error: emailLogError } = await supabaseServer
      .from('email_logs')
      .insert({
        lead_id: lead.id,
        template_id: template.id,
        to_email: lead.email,
        subject: template.subject,
        status: 'sent',
      })

    if (emailLogError) {
      console.warn('EMAIL LOG INSERT SKIPPED:', emailLogError.message)
    }

    /* ================= SET FOLLOW-UP DATE (+48 HOURS) ================= */
    const followUpDate = new Date()
    followUpDate.setHours(followUpDate.getHours() + 48)

    /* ================= RECORD ACTION (NOT STAGE) ================= */
    const updatedStageMetadata = {
      ...(lead.stage_metadata || {}),
      email_sent: true,
      email_sent_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabaseServer
      .from('temp_leads_basics')
      .update({
        stage_metadata: updatedStageMetadata,
        follow_up_date: followUpDate.toISOString(),
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('FAILED TO UPDATE STAGE METADATA:', updateError)
      return NextResponse.json(
        { error: 'Failed to record email action' },
        { status: 500 }
      )
    }

    console.log('EMAIL ACTION RECORDED (STAGE NOT CHANGED)')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Send email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
