import { NextResponse } from 'next/server'
import { createServer, supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: Request) {
    try {
        const { documentId, filePath, intakeFormId } = await req.json()

        if (!documentId || !filePath) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate Authentication / Authorization
        const supabaseSession = await createServer()
        const { data: { user } } = await supabaseSession.auth.getUser()

        // Allowed: User is signed in OR they have the matching intakeFormId
        if (!user && !intakeFormId) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 1. Delete from Supabase Storage
        const { error: storageError } = await supabaseServer.storage
            .from('documents')
            .remove([filePath])

        if (storageError) {
            console.error('Storage Delete Error:', storageError)
            // Even if storage delete fails (maybe file already gone), we might want to proceed with DB delete
        }

        // 2. Delete from Database
        const { error: dbError } = await supabaseServer
            .from('uploaded_documents')
            .delete()
            .eq('id', documentId)

        if (dbError) {
            console.error('Database Delete Error:', dbError)
            return NextResponse.json({ error: 'Failed to delete document from database' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('Delete Document API Error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
