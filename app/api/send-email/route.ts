import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendGraphEmail } from '@/lib/microsoftGraph'
import { authenticateApiRequest, authorizeLeadAccess } from '@/utils/auth'

export async function POST(req: Request) {
  try {
    const auth = await authenticateApiRequest(req, ['csr', 'admin', 'superadmin'])
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const contentType = req.headers.get('content-type') || '';
    let leadId: string | undefined;
    let templateId: string | undefined;
    let formType: string | undefined;
    let intakeId: string | null | undefined;
    let customSubject: string | undefined;
    let customBody: string | undefined;
    let attachments: Array<{ name: string; contentType: string; contentBytes: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      leadId = (formData.get('leadId') as string) || undefined;
      templateId = (formData.get('templateId') as string) || undefined;
      formType = (formData.get('formType') as string) || undefined;
      intakeId = (formData.get('intakeId') as string) || null;
      customSubject = (formData.get('customSubject') as string) || undefined;
      customBody = (formData.get('customBody') as string) || undefined;

      const files = formData.getAll('attachments');
      if (files && files.length > 0) {
        if (files.length > 20) {
          return NextResponse.json({ error: 'Maximum 20 attachments allowed.' }, { status: 400 });
        }
        const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        let totalSizeBytes = 0;
        for (const item of files) {
          if (item instanceof File && item.size > 0 && item.name) {
            if (!ALLOWED_MIME_TYPES.includes(item.type)) {
              return NextResponse.json({ error: `Invalid file type for "${item.name}". Allowed: PDF, JPG, PNG, DOC, DOCX` }, { status: 400 });
            }
            if (item.size > 10 * 1024 * 1024) {
              return NextResponse.json({ error: `Attachment "${item.name}" exceeds 10MB limit.` }, { status: 400 });
            }
            totalSizeBytes += item.size;
            if (totalSizeBytes > 10 * 1024 * 1024) {
              return NextResponse.json({ error: 'Total attachment size exceeds 10MB limit.' }, { status: 400 });
            }

            const arrayBuffer = await item.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            attachments.push({
              name: item.name,
              contentType: item.type || 'application/octet-stream',
              contentBytes: buffer.toString('base64')
            });
          }
        }
      }
    } else {
      const body = await req.json();
      leadId = body.leadId;
      templateId = body.templateId;
      formType = body.formType;
      intakeId = body.intakeId;
      customSubject = body.customSubject;
      customBody = body.customBody;

      if (body.attachments && Array.isArray(body.attachments) && body.attachments.length > 0) {
        if (body.attachments.length > 20) {
          return NextResponse.json({ error: 'Maximum 20 attachments allowed.' }, { status: 400 });
        }
        const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        let totalSizeApprox = 0;
        for (const att of body.attachments) {
          if (!att || !att.name || !att.contentType || !att.contentBytes) {
            return NextResponse.json({ error: 'Invalid or empty attachment structure provided.' }, { status: 400 });
          }
          if (!ALLOWED_MIME_TYPES.includes(att.contentType)) {
            return NextResponse.json({ error: `Invalid file type for "${att.name}". Allowed: PDF, JPG, PNG, DOC, DOCX` }, { status: 400 });
          }
          const approxBytes = (att.contentBytes.length * 3) / 4;
          totalSizeApprox += approxBytes;
          if (approxBytes > 10 * 1024 * 1024) {
            return NextResponse.json({ error: `Attachment "${att.name}" exceeds 10MB limit.` }, { status: 400 });
          }
        }
        if (totalSizeApprox > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'Total attachment size exceeds 10MB limit.' }, { status: 400 });
        }
        attachments = body.attachments;
      }
    }

    console.log('SEND EMAIL API HIT:', { leadId, templateId, formType, intakeId, hasCustom: !!customBody, attachmentsCount: attachments.length })

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

    /* ================= AUTHORIZE & FETCH LEAD ================= */
    const authLead = await authorizeLeadAccess(auth.profile, leadId)
    if (!authLead.authorized || !authLead.lead) {
      return NextResponse.json(
        { error: authLead.error || 'Lead not found' },
        { status: authLead.status || 404 }
      )
    }
    const lead = authLead.lead
    
    if (!lead.email) {
      console.error('LEAD HAS NO EMAIL')
      return NextResponse.json(
        { error: 'Lead has no email' },
        { status: 400 }
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
      const styledLink = `<a href="${formLink}" style="color: #10B889; font-weight: bold; text-decoration: underline;">Click Here to Fill Form</a>`
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
      await sendGraphEmail([lead.email], finalSubject, finalBody, undefined, undefined, attachments);
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
