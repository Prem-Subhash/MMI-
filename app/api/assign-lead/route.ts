import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { authenticateApiRequest } from '@/utils/auth'

export async function POST(req: Request) {
    try {
        const auth = await authenticateApiRequest(req, ['admin', 'superadmin'])
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        const body = await req.json()
        const { leadId, targetUserId } = body

        if (!leadId) {
            return NextResponse.json(
                { error: 'Missing required parameter: leadId' },
                { status: 400 }
            )
        }

        // Validate targetUserId if provided (can be null or UUID string)
        const targetValue = (targetUserId === 'unassigned' || targetUserId === '' || targetUserId === undefined || targetUserId === null)
            ? null
            : targetUserId

        // 1. Fetch lead to check for multi-policy lead_group_id
        const { data: targetLead, error: fetchError } = await supabaseServer
            .from('temp_leads_basics')
            .select('id, lead_group_id')
            .eq('id', leadId)
            .maybeSingle()

        if (fetchError || !targetLead) {
            return NextResponse.json(
                { error: fetchError?.message || 'Lead record not found' },
                { status: 404 }
            )
        }

        // 2. Perform server-side update with service-role client
        let updateQuery = supabaseServer
            .from('temp_leads_basics')
            .update({ assigned_csr: targetValue })

        if (targetLead.lead_group_id) {
            updateQuery = updateQuery.eq('lead_group_id', targetLead.lead_group_id)
        } else {
            updateQuery = updateQuery.eq('id', leadId)
        }

        const { data: updatedRows, error: updateError } = await updateQuery.select('id, assigned_csr')

        if (updateError) {
            console.error('Server error updating lead assignment:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        if (!updatedRows || updatedRows.length === 0) {
            return NextResponse.json(
                { error: 'Lead assignment did not update any database row' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            updatedCount: updatedRows.length,
            rows: updatedRows
        })
    } catch (err: any) {
        console.error('Unexpected error in assign-lead API:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
