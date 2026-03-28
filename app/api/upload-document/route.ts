import { NextResponse } from 'next/server'
import { createServer, supabaseServer } from '@/lib/supabaseServer'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function POST(req: Request) {
    try {
        // 1. Validate Authentication
        const supabaseSession = await createServer()
        const { data: { user } } = await supabaseSession.auth.getUser()

        // 2. Parse FormData
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const leadId = formData.get('leadId') as string | null
        const intakeFormId = formData.get('intakeFormId') as string | null

        // Allowed: User is signed in OR they have an explicit intakeFormId (Client uploading documents)
        if (!user && !intakeFormId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!leadId && !intakeFormId) {
            return NextResponse.json({ error: 'Missing leadId or intakeFormId' }, { status: 400 })
        }

        // 3. File Validation
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 })
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX' }, { status: 400 })
        }

        // 4. Resolve Intake Form ID (Since uploaded_documents is linked to intake_form_id)
        let targetIntakeFormId = intakeFormId

        if (!targetIntakeFormId && leadId) {
            // Find existing intake form for this lead
            const { data: intake } = await supabaseServer
                .from('temp_intake_forms')
                .select('id')
                .eq('lead_id', leadId)
                .order('submitted_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (intake) {
                targetIntakeFormId = intake.id
            } else {
                // Need to create a base intake form to bind the documents directly to the Lead
                const { data: newIntake, error: createError } = await supabaseServer
                    .from('temp_intake_forms')
                    .insert({ lead_id: leadId, form_type: 'document_upload', status: 'submitted' })
                    .select('id')
                    .single()

                if (createError || !newIntake) {
                    throw new Error('Could not resolve or create intake form record for lead mapping')
                }
                targetIntakeFormId = newIntake.id
            }
        }

        // 5. Upload to Supabase Storage
        const fileBuffer = await file.arrayBuffer()
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${targetIntakeFormId}/${fileName}`

        // Ensure there is a bucket called "documents" in Supabase
        const { error: uploadError } = await supabaseServer.storage
            .from('documents')
            .upload(filePath, fileBuffer, {
                contentType: file.type,
                upsert: false
            })

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError)
            return NextResponse.json({ error: 'Failed to upload to Supabase storage' }, { status: 500 })
        }

        // 6. Store metadata in uploaded_documents table
        const { data: docRecord, error: dbError } = await supabaseServer
            .from('uploaded_documents')
            .insert({
                intake_form_id: targetIntakeFormId,
                file_name: file.name,
                file_path: filePath,
                file_type: file.type,
                uploaded_at: new Date().toISOString()
            })
            .select()
            .single()

        if (dbError) {
            console.error('Database Insert Error:', dbError)
            return NextResponse.json({ error: 'Failed to save document metadata in database' }, { status: 500 })
        }

        return NextResponse.json({ success: true, document: docRecord })

    } catch (err: any) {
        console.error('Upload API Fatal Error:', err)
        return NextResponse.json({ error: 'Internal server error while processing upload' }, { status: 500 })
    }
}
