import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { authenticateApiRequest, authorizeLeadAccess } from '@/utils/auth'
import { formatPhoneInput } from '@/utils/phoneFormatter'

export async function POST(req: Request) {
  try {
    const auth = await authenticateApiRequest(req, ['csr', 'admin', 'superadmin'])
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { user } = auth

    const { leadId, client_name, email, phone, selectedPolicies, business_name } = await req.json()

    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })
    }

    /* ================= 1. AUTHORIZE & FETCH DATA ================= */
    const authLead = await authorizeLeadAccess(auth.profile, leadId)
    if (!authLead.authorized || !authLead.lead) {
      return NextResponse.json(
        { error: authLead.error || 'Lead not found' },
        { status: authLead.status || 404 }
      )
    }
    const lead = authLead.lead

    /* ================= 2. NORMALIZE & COMPARE ================= */
    const cleanPhone = (p: string) => formatPhoneInput(p)
    
    // Fetch lead_policies since authorizeLeadAccess only selects '*'
    const { data: policiesData } = await supabaseServer
      .from('lead_policies')
      .select('policy_type')
      .eq('lead_id', leadId)

    const oldName = lead.client_name || ''
    const oldEmail = lead.email || ''
    const oldPhone = cleanPhone(lead.phone || '')
    const oldBusinessName = lead.business_name || ''
    const oldPolicies = policiesData && policiesData.length > 0
      ? policiesData.map((p: any) => p.policy_type)
      : lead.policy_type ? [lead.policy_type] : []
    
    const newName = (client_name || '').trim()
    const newEmail = (email || '').trim()
    const newPhone = cleanPhone(phone || '')
    const newBusinessName = (business_name || '').trim()
    const newPolicies = Array.isArray(selectedPolicies) ? selectedPolicies : []

    const changes: Record<string, { old: string, new: string }> = {}

    if (newName && newName !== oldName) changes.client_name = { old: oldName, new: newName }
    if (newEmail !== oldEmail) changes.email = { old: oldEmail, new: newEmail }
    if (newPhone !== oldPhone) changes.phone = { old: oldPhone, new: newPhone }
    if (newBusinessName !== oldBusinessName) changes.business_name = { old: oldBusinessName, new: newBusinessName }
    
    const sortedOldPolicies = [...oldPolicies].sort()
    const sortedNewPolicies = [...newPolicies].sort()
    const policiesChanged = JSON.stringify(sortedOldPolicies) !== JSON.stringify(sortedNewPolicies) && newPolicies.length > 0
    if (policiesChanged) changes.policies = { old: oldPolicies.join(', '), new: newPolicies.join(', ') }

    const changedFields = Object.keys(changes)

    if (changedFields.length === 0) {
      return NextResponse.json({ success: true, message: 'No changes detected' })
    }

    /* ================= 3. SAFE UPDATE SEQUENCE ================= */
    
    // A. Update temp_leads_basics
    const updatePayload: any = {
      client_name: newName || oldName,
      email: newEmail,
      phone: newPhone,
      business_name: newBusinessName
    }

    if (policiesChanged) {
      updatePayload.policy_type = newPolicies[0]
    }

    const { error: updateLeadError } = await supabaseServer
      .from('temp_leads_basics')
      .update(updatePayload)
      .eq('id', leadId)

    if (updateLeadError) {
      console.error('Update lead basics failed:', updateLeadError)
      return NextResponse.json({ error: 'Failed to update lead information' }, { status: 500 })
    }

    // B. Update clients table (if exists)
    if (lead.client_id) {
      const { error: updateClientError } = await supabaseServer
        .from('clients')
        .update({
          client_name: newName || oldName,
          email: newEmail,
          phone: newPhone
        })
        .eq('id', lead.client_id)

      if (updateClientError) {
        console.error('Update clients table failed:', updateClientError)
        // Note: We already updated the lead. In a true transaction we would rollback, 
        // but here we stop to prevent further inconsistent state.
        return NextResponse.json({ error: 'Lead updated, but global client record failed. Please contact support.' }, { status: 500 })
      }
    }

    // C. Update Multi-Policy Table
    if (policiesChanged) {
      await supabaseServer.from('lead_policies').delete().eq('lead_id', leadId)
      
      const policiesPayload = newPolicies.map((p) => ({
        lead_id: leadId,
        policy_type: p
      }))
      
      const { error: policiesError } = await supabaseServer.from('lead_policies').insert(policiesPayload)
      if (policiesError) {
        console.error('Update policies failed:', policiesError)
      }
    }

    // D. Insert Audit Logs
    const auditLogs = changedFields.map(field => ({
      user_id: user.id,
      action: 'UPDATE_CLIENT',
      entity: 'temp_leads_basics',
      entity_id: leadId,
      metadata: {
        field,
        old_value: changes[field].old,
        new_value: changes[field].new
      }
    }))

    const { error: auditError } = await supabaseServer
      .from('audit_logs')
      .insert(auditLogs)

    if (auditError) {
      console.error('Audit logging failed:', auditError)
      // We don't fail the request here as the primary updates were successful
    }

    /* ================= 4. RESPONSE ================= */
    const fieldLabels: Record<string, string> = {
      client_name: 'Name',
      email: 'Email',
      phone: 'Phone',
      business_name: 'Business Name',
      policies: 'Policies'
    }
    const updatedLabelList = changedFields.map(f => fieldLabels[f] || f).join(', ')

    return NextResponse.json({ 
      success: true, 
      message: `Updated: ${updatedLabelList}`,
      updatedFields: changedFields
    })

  } catch (error: any) {
    console.error('Update Client API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
