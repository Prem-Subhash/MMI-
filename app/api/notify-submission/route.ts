import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendGraphEmail } from '@/lib/microsoftGraph'

export async function POST(req: Request) {
    try {
        const { leadId, intakeId, formType } = await req.json()

        let targetLeadId = leadId

        /* ================= RESOLVE LEAD ID ================= */
        if (!targetLeadId && intakeId) {
            const { data: intake, error: intakeError } = await supabaseServer
                .from('temp_intake_forms')
                .select('lead_id')
                .eq('id', intakeId)
                .single()

            if (!intakeError && intake) {
                targetLeadId = intake.lead_id
            }
        }

        if (!targetLeadId) {
            return NextResponse.json(
                { error: 'Missing leadId or valid intakeId' },
                { status: 400 }
            )
        }

        /* ================= FETCH LEAD ================= */
        const { data: lead, error: leadError } = await supabaseServer
            .from('temp_leads_basics')
            .select('assigned_csr, stage_metadata')
            .eq('id', targetLeadId)
            .single()

        if (leadError || !lead) {
            console.error('LEAD FETCH ERROR:', leadError)
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            )
        }

        /* ================= DETERMINE RECIPIENTS ================= */
        let assignedCsrEmail = process.env.MICROSOFT_SENDER_EMAIL
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.MICROSOFT_SENDER_EMAIL

        if (lead.assigned_csr) {
            const { data: userData, error: userError } = await supabaseServer.auth.admin.getUserById(
                lead.assigned_csr
            )

            if (!userError && userData?.user?.email) {
                assignedCsrEmail = userData.user.email
            } else {
                console.warn('Could not fetch assigned CSR email, using default.', userError)
            }
        }

        /* ================= SEND EMAIL ================= */
        try {
            // Remove duplicates if assignedCsrEmail === adminEmail
            const recipients = Array.from(new Set([assignedCsrEmail!, adminEmail!]))

            await sendGraphEmail(
                recipients,
                "New Form Submitted",
                `<p>Client has submitted the form (${formType}).</p>`
            )
            console.log('SUBMISSION NOTIFICATION SENT VIA GRAPH API')
        } catch (emailError: any) {
            console.error('FAILED TO SEND NOTIFICATION:', emailError)
            // We don't fail the request because the form was already submitted successfully
            return NextResponse.json(
                { warning: `Email notification failed: ${emailError.message}` },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Notify submission API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
