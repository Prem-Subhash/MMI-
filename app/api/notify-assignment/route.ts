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
        const { targetUserId, leadId, clientName, policyFlow, insuranceCategory, policyType, targetUserRole } = body

        if (!targetUserId || !leadId) {
            return NextResponse.json(
                { error: 'Missing required parameters: targetUserId and leadId are required' },
                { status: 400 }
            )
        }

        const finalClientName = clientName || 'Client'
        const isRenewal = (policyFlow || '').toLowerCase() === 'renewal'
        const isCommercial = (insuranceCategory || '').toLowerCase() === 'commercial'
        const isAdmin = targetUserRole === 'admin' || targetUserRole === 'superadmin'

        // Determine Category prefix and Flow suffix for Title
        const categoryLabel = isCommercial ? 'Commercial' : 'Personal'
        const flowLabel = isRenewal ? 'Renewal' : 'Lead'
        const notificationTitle = `New ${categoryLabel} ${flowLabel} Assigned`

        // Format Policy Type
        const finalPolicyType = policyType || '—'
        const notificationMessage = `Client: ${finalClientName}\nPolicy: ${finalPolicyType}`

        const notificationLink = isRenewal
            ? (isAdmin ? `/admin/leads/renewals/${leadId}` : `/csr/renewals/${leadId}`)
            : `/csr/leads/${leadId}`

        const notificationPayload = {
            user_id: targetUserId,
            title: notificationTitle,
            message: notificationMessage,
            lead_id: leadId,
            link: notificationLink,
            client_name: finalClientName
        }

        const { error: insertError } = await supabaseServer
            .from('user_notifications')
            .insert(notificationPayload)

        if (insertError) {
            console.error('Server error inserting assignment notification:', insertError)
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Unexpected error in notify-assignment API:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
