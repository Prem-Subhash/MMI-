import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { authenticateApiRequest, authorizeLeadAccess } from '@/utils/auth'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        if (!id) {
            return NextResponse.json({ error: 'Missing document ID' }, { status: 400 })
        }

        // 1. Authenticate session
        const auth = await authenticateApiRequest(req)
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        // 2. Fetch document record
        const { data: document, error: dbError } = await supabaseServer
            .from('uploaded_documents')
            .select('file_path, intake_form_id')
            .eq('id', id)
            .single()

        if (dbError || !document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }

        // 2.5 Authorize Lead Access
        if (document.intake_form_id) {
            const { data: intake } = await supabaseServer
                .from('temp_intake_forms')
                .select('lead_id')
                .eq('id', document.intake_form_id)
                .single()

            if (intake?.lead_id) {
                const authLead = await authorizeLeadAccess(auth.profile, intake.lead_id)
                if (!authLead.authorized) {
                    return NextResponse.json({ error: authLead.error }, { status: authLead.status })
                }
            }
        }

        // 3. Generate Signed URL
        const { data, error: signedUrlError } = await supabaseServer
            .storage
            .from('documents')
            .createSignedUrl(document.file_path, 60)

        if (signedUrlError || !data?.signedUrl) {
            return NextResponse.json({ error: 'Failed to generate secure document link' }, { status: 500 })
        }

        // 4. Redirect to the signed URL
        return NextResponse.redirect(data.signedUrl)

    } catch (err) {
        console.error('Document Retrieval Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
