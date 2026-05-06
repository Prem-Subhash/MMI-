import { NextResponse } from 'next/server'
import { createServer, supabaseServer } from '@/lib/supabaseServer'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const intakeFormId = searchParams.get('intakeFormId')

        if (!intakeFormId) {
            return NextResponse.json({ error: 'Missing intakeFormId' }, { status: 400 })
        }

        // 1. Authenticate CSR/Admin session
        const supabaseSession = await createServer()
        const { data: { user }, error: authError } = await supabaseSession.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
