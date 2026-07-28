import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { authenticateApiRequest, authorizeLeadAccess } from '@/utils/auth'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const intakeFormId = searchParams.get('intakeFormId')

        if (!intakeFormId) {
            return NextResponse.json({ error: 'Missing intakeFormId' }, { status: 400 })
        }

        // 1. Authenticate CSR/Admin session
        const auth = await authenticateApiRequest(req)
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        // 1.5 Fetch Intake Form to get Lead ID for authorization
        const { data: intake } = await supabaseServer
            .from('temp_intake_forms')
            .select('lead_id')
            .eq('id', intakeFormId)
            .single()

        if (intake?.lead_id) {
            const authLead = await authorizeLeadAccess(auth.profile, intake.lead_id)
            if (!authLead.authorized) {
                return NextResponse.json({ error: authLead.error }, { status: authLead.status })
            }
        }

        // 2. Fetch documents using server-side admin client (bypasses RLS safely)
        const { data: documents, error: dbError } = await supabaseServer
            .from('uploaded_documents')
            .select('*')
            .eq('intake_form_id', intakeFormId)
            .order('uploaded_at', { ascending: false })

        if (dbError) {
            console.error('Error fetching documents:', dbError)
            return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
        }

        return NextResponse.json(documents || [])

    } catch (err) {
        console.error('Document List API Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
