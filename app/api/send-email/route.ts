import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendGraphEmail } from '@/lib/microsoftGraph'
import { authenticateApiRequest } from '@/utils/auth'

export async function POST(req: Request) {
  try {
    const auth = await authenticateApiRequest(req, ['csr', 'admin', 'superadmin'])
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { leadId, templateId, formType, intakeId, customSubject, customBody } = await req.json()

    console.log('SEND EMAIL API HIT:', { leadId, templateId, formType, intakeId, hasCustom: !!customBody })

    if (!leadId || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!customBody && (!formType || !intakeId)) {
      return NextResponse.json(
        { error: 'Missing form required fields' },
        { status: 400 }
      )
    }

    /* ================= FETCH LEAD ================= */
    const { data: lead, error: leadError } = await supabaseServer
      .from('temp_leads_basics')
      .select('id, client_name, email, stage_metadata, status, policy_flow, policy_type, lead_group_id')
      .eq('id', leadId)
      .single()

    if (leadError || !lead || !lead.email) {
      console.error('LEAD FETCH ERROR:', leadError)
      return NextResponse.json(
        { error: 'Invalid lead or missing email' },
        { status: 404 }
      )
    }

    /* ================= FETCH SIBLING LEADS FOR GROUP ================= */
    let siblings = [{ id: lead.id, policy_type: lead.policy_flow === 'renewal' ? lead.policy_flow : (lead.policy_type || 'home') }];
    if (lead.lead_group_id) {
      const { data: siblingData, error: siblingError } = await supabaseServer
        .from('temp_leads_basics')
        .select('id, policy_type')
        .eq('lead_group_id', lead.lead_group_id)
      
      if (!siblingError && siblingData && siblingData.length > 0) {
        siblings = siblingData;
      }
    }

    /* ================= FETCH EMAIL TEMPLATE & PREPARE BODY ================= */
    let finalSubject = customSubject || ''
    let finalBody = customBody || ''

    if (!finalBody || !finalSubject) {
      const { data: template, error: templateError } = await supabaseServer
        .from('email_templates')
        .select('id, name, subject, body, policy_type, policy_flow')
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

      // Fetch all sibling templates with the same name to support dynamic combination
      let allTemplates = [template];
      const { data: siblingTemplates } = await supabaseServer
        .from('email_templates')
        .select('id, name, subject, body, policy_type, policy_flow')
        .eq('name', template.name)
        .eq('is_active', true)
      if (siblingTemplates && siblingTemplates.length > 0) {
        allTemplates = siblingTemplates;
      }

      /* ================= PREPARE EMAIL BODY ================= */
      const { replaceCombinedTemplate } = await import('@/lib/emailTemplating')
      const dummyData = {
        clientName: lead.client_name || '',
        effDate: '',
        singleCarrier: '',
        defCurrentCarrier: '',
        defNewCarrier: '',
        payType: 'bank account',
        last4: '',
        manualYear: new Date().getFullYear().toString(),
        policies: []
      }
      
      const combinedLead = {
        ...lead,
        lead_policies: siblings.map(s => ({ policy_type: s.policy_type }))
      }
      
      const { subject: combinedSubject, body: combinedBody } = replaceCombinedTemplate(
        template.name || '',
        lead.policy_flow || template.policy_flow || 'lead',
        dummyData,
        combinedLead,
        allTemplates,
        undefined,
        undefined,
        undefined
      )
      
      finalSubject = customSubject || combinedSubject
      finalBody = combinedBody
    }

    /* ================= GENERATE & RESOLVE FORM LINK GLOBALLY ================= */
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
    const formLink = intakeId && baseUrl ? `${baseUrl}/intake/${intakeId}` : ''
    
    if (finalBody && formLink) {
      const styledLink = `<a href="${formLink}" style="color: #10B889; font-weight: bold; text-decoration: underline;">${formLink}</a>`
      finalBody = finalBody.replace(/{{\s*form_link\s*}}/g, styledLink)
    }

    /* ================= EXTRACT EMAIL TYPE FOR LOGS ================= */
    let emailTypeName = 'manual';
    let isInfoReq = false;

    if (templateId) {
      const { data: dbTemplate } = await supabaseServer
        .from('email_templates')
        .select('name')
        .eq('id', templateId)
        .maybeSingle();

      if (dbTemplate?.name) {
        emailTypeName = dbTemplate.name;
        if (dbTemplate.name === 'info_req') isInfoReq = true;
      }
    }

    /* ================= BACKEND SAFETY CHECK (FAIL-SAFE) ================= */
    if (lead?.policy_flow !== 'renewal') {
      const requiresForm = isInfoReq || !!intakeId;

      if (requiresForm) {
        // Validate that either the full generated link or at least the intake ID path exists in the body
        const linkPath = intakeId ? `/intake/${intakeId}` : '{{form_link}}';
        if (!finalBody || (!finalBody.includes(formLink) && !finalBody.includes(linkPath))) {
          console.error(`FAIL-SAFE: Form link missing from final email body. Lead: ${lead.id}`);
          return NextResponse.json(
            { error: 'Form link missing. Cannot send email.' },
            { status: 400 }
          );
        }
      }
    }

    /* ================= SEND EMAIL AND LOG (EXPLICIT) ================= */
    try {
      // Intentionally omitting leadId and emailType to prevent duplicate MS Graph generic hook logging
      await sendGraphEmail([lead.email], finalSubject, finalBody);
      console.log('EMAIL SENT SUCCESSFULLY VIA GRAPH API');

      const logsToInsert = siblings.map(sibling => ({
        lead_id: sibling.id,
        email_type: emailTypeName,
        recipient: lead.email,
        status: 'sent',
        created_at: new Date().toISOString()
      }));

      await supabaseServer
        .from("email_logs")
        .insert(logsToInsert);

    } catch (emailError: any) {
      console.error('FAILED TO SEND EMAIL VIA GRAPH:', emailError);

      const logsToInsert = siblings.map(sibling => ({
        lead_id: sibling.id,
        email_type: emailTypeName,
        recipient: lead.email,
        status: 'failed',
        error_message: emailError.message || String(emailError),
        created_at: new Date().toISOString()
      }));

      await supabaseServer
        .from("email_logs")
        .insert(logsToInsert);

      return NextResponse.json(
        { success: false, message: 'Failed to send email', error: `Email send failed: ${emailError.message}` },
        { status: 500 }
      );
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

    /* ================= DETERMINE NEW STATUS ================= */
    let newStatus = lead.status;
    if (lead.status !== 'SUBMITTED' && lead.status !== 'ACCEPTED') {
      newStatus = 'WAITING_FOR_SUBMISSION';
    }

    const { error: updateError } = await supabaseServer
      .from('temp_leads_basics')
      .update({
        status: newStatus,
        send_email: true,
        intake_email_sent: true,
        stage_metadata: updatedStageMetadata,
        follow_up_date: followUpDate.toISOString(),
      })
      .in('id', siblings.map(s => s.id))

    if (updateError) {
      console.error('FAILED TO UPDATE STAGE METADATA:', updateError)
      return NextResponse.json(
        { error: 'Failed to record email action' },
        { status: 500 }
      )
    }

    console.log('EMAIL ACTION RECORDED (STAGE NOT CHANGED)')

    return NextResponse.json({ success: true, message: 'Email sent successfully' })
  } catch (error: any) {
    console.error('Send email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
