import { NextResponse } from 'next/server'
import { supabaseServer, createServer } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const supabase = await createServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['csr', 'admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { leadId, client_name, email, phone } = await req.json()

    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })
    }

    /* ================= 1. FETCH CURRENT DATA ================= */
    const { data: lead, error: leadError } = await supabaseServer
      .from('temp_leads_basics')
      .select('client_name, email, phone, client_id')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    /* ================= 2. NORMALIZE & COMPARE ================= */
    const cleanPhone = (p: string) => p.replace(/\D/g, '').slice(0, 10)
    
    const oldName = lead.client_name || ''
    const oldEmail = lead.email || ''
    const oldPhone = cleanPhone(lead.phone || '')
    
    const newName = (client_name || '').trim()
    const newEmail = (email || '').trim()
    const newPhone = cleanPhone(phone || '')

    const changes: Record<string, { old: string, new: string }> = {}

    if (newName && newName !== oldName) changes.client_name = { old: oldName, new: newName }
    if (newEmail !== oldEmail) changes.email = { old: oldEmail, new: newEmail }
    if (newPhone !== oldPhone) changes.phone = { old: oldPhone, new: newPhone }

    const changedFields = Object.keys(changes)

    if (changedFields.length === 0) {
      return NextResponse.json({ success: true, message: 'No changes detected' })
    }

    /* ================= 3. SAFE UPDATE SEQUENCE ================= */
    
    // A. Update temp_leads_basics
    const { error: updateLeadError } = await supabaseServer
      .from('temp_leads_basics')
      .update({
        client_name: newName || oldName,
        email: newEmail,
        phone: newPhone
      })
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

    // C. Insert Audit Logs
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
      phone: 'Phone'
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
