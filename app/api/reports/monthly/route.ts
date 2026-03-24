import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import ExcelJS from 'exceljs'
import { TransformStream } from 'node:stream/web'

// 1. Zod Input Validation
const ReportSchema = z.object({
    month: z.string().optional(), // Support legacy month filter YYYY-MM
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD required").optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD required").optional(),
    policy_flow: z.enum(['new', 'renewal', 'all', '']).optional(),
    insurence_category: z.enum(['personal', 'commercial', 'all', '']).optional(),
    assigned_csr: z.string().uuid().optional().or(z.literal('')),
    customer_name: z.string().optional(),
    page: z.number().min(1).default(1),
    limit: z.number().min(10).max(100).default(50),
    exportType: z.enum(['json', 'excel', 'pdf']).default('json')
})

export async function POST(request: Request) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    // Auth Check
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const body = await request.json()
    const parseResult = ReportSchema.safeParse(body)

    if (!parseResult.success) {
        return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 })
    }

    let { month, start_date, end_date, policy_flow, insurence_category, assigned_csr, customer_name, page, limit, exportType } = parseResult.data

    // 2. Date Parsing
    // Determine start/end dynamically based on month or custom range
    if (month && !start_date && !end_date) {
        start_date = `${month}-01`
        const [y, m] = month.split('-')
        const date = new Date(parseInt(y), parseInt(m), 0)
        end_date = date.toISOString().split('T')[0]
    }

    if (!start_date || !end_date) {
        return NextResponse.json({ error: 'Valid date range (month or start_date/end_date) is required.' }, { status: 400 });
    }

    if (new Date(start_date) > new Date(end_date)) {
        return NextResponse.json({ error: 'start_date cannot be after end_date' }, { status: 400 });
    }

    const safeFlow = policy_flow === 'all' ? null : policy_flow
    const safeCategory = insurence_category === 'all' ? null : insurence_category

    // 3. Fetch KPI Summary (RPC handles RLS securely)
    const { data: summaryData, error: summaryError } = await supabase.rpc('get_report_summary', {
        p_start_date: start_date,
        p_end_date: end_date,
        p_flow: safeFlow || null,
        p_category: safeCategory || null,
        p_csr: assigned_csr || null
    })

    if (summaryError) {
        console.error('Summary Error:', summaryError)
        return NextResponse.json({ error: 'Failed to generate KPI summary' }, { status: 500 })
    }

    // 4. Base Query Builder (RLS handles visibility natively)
    let query = supabase
        .from('temp_leads_basics')
        .select(`
            id,
            client_name,
            policy_type,
            effective_date,
            created_at,
            carrier,
            total_premium,
            policy_number,
            policy_flow,
            insurence_category,
            assigned_csr,
            assigned_csr_profile:profiles!assigned_csr (full_name)
        `, { count: 'exact' })
        .gte('effective_date', start_date)
        .lte('effective_date', end_date)

    if (safeFlow) query = query.eq('policy_flow', safeFlow)
    if (safeCategory) query = query.eq('insurence_category', safeCategory)
    if (assigned_csr) query = query.eq('assigned_csr', assigned_csr)
    if (customer_name) query = query.ilike('client_name', `%${customer_name}%`)

    // Order by date explicitly 
    query = query.order('effective_date', { ascending: false })

    // JSON Preview (Paginated)
    if (exportType === 'json') {
        const from = (page - 1) * limit
        const to = from + limit - 1
        query = query.range(from, to)

        const { data, count, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            summary: summaryData,
            data,
            pagination: { total: count, page, limit }
        })
    }

    // 5. Handle Export (Unpaginated stream logic)
    // NOTE: For 50,000+ records, this shouldn't execute via the Edge/Serverless function.
    // Recommended: Send this request to an Inngest worker which fetches, builds to S3, and emails link.
    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (exportType === 'excel') {
        const workbook = new ExcelJS.Workbook()

        // Setup Summary Sheet
        const summarySheet = workbook.addWorksheet('KPI Summary')
        summarySheet.columns = [{ width: 30 }, { width: 20 }]
        summarySheet.addRow(['Metric', 'Value'])
        summarySheet.getRow(1).font = { bold: true }
        summarySheet.addRow(['Total Policies', summaryData?.total_policies || 0])
        summarySheet.addRow(['Total Premium', `$${(summaryData?.total_premium || 0).toLocaleString()}`])
        summarySheet.addRow(['New Business Premium', `$${(summaryData?.new_business_premium || 0).toLocaleString()}`])
        summarySheet.addRow(['Renewal Premium', `$${(summaryData?.renewal_premium || 0).toLocaleString()}`])
        summarySheet.addRow(['Personal Lines', summaryData?.personal_line_count || 0])
        summarySheet.addRow(['Commercial Lines', summaryData?.commercial_line_count || 0])

        // Setup Data Sheet
        const worksheet = workbook.addWorksheet('Raw Data')
        worksheet.columns = [
            { header: 'Client Name', key: 'client_name', width: 25 },
            { header: 'Type', key: 'policy_type', width: 20 },
            { header: 'Category', key: 'insurence_category', width: 15 },
            { header: 'Flow', key: 'policy_flow', width: 15 },
            { header: 'Premium', key: 'total_premium', width: 15 },
            { header: 'CSR', key: 'csr', width: 25 },
            { header: 'Effective Date', key: 'effective_date', width: 15 },
        ]
        worksheet.getRow(1).font = { bold: true }

        data?.forEach((row: any) => {
            worksheet.addRow({
                client_name: row.client_name,
                policy_type: row.policy_type,
                insurence_category: row.insurence_category,
                policy_flow: row.policy_flow,
                total_premium: row.total_premium,
                csr: row.assigned_csr_profile?.full_name || row.assigned_csr,
                effective_date: row.effective_date
            })
        })

        // Final Totals Row
        worksheet.addRow({})
        const finalRow = worksheet.addRow({ client_name: 'TOTALS', total_premium: summaryData?.total_premium || 0 })
        finalRow.font = { bold: true }

        const buffer = await workbook.xlsx.writeBuffer()

        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Enterprise_Report_${start_date}_to_${end_date}.xlsx"`
            }
        })
    }

    if (exportType === 'pdf') {
        const { default: PDFDocument } = await import('pdfkit')
        const doc = new PDFDocument({ margin: 30, size: 'A4' })

        const headers = new Headers()
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `attachment; filename="Enterprise_Report_${start_date}_to_${end_date}.pdf"`)

        const { readable, writable } = new globalThis.TransformStream()
        const writer = writable.getWriter()

        doc.pipe({
            write: (chunk: any) => writer.write(chunk),
            end: () => writer.close(),
            on: () => { }, once: () => { }, emit: () => true,
        } as any)

        // Title and KPI Summary
        doc.fontSize(18).font('Helvetica-Bold').text(`Enterprise Report`, { align: 'center' })
        doc.fontSize(10).font('Helvetica').text(`Period: ${start_date} to ${end_date}`, { align: 'center' })
        doc.moveDown(2)

        doc.fontSize(12).font('Helvetica-Bold').text('KPI Summary')
        doc.fontSize(10).font('Helvetica')
        doc.text(`Total Policies: ${summaryData?.total_policies || 0}`)
        doc.text(`Total Premium: $${(summaryData?.total_premium || 0).toLocaleString()}`)
        doc.text(`New Business: $${(summaryData?.new_business_premium || 0).toLocaleString()} | Renewal: $${(summaryData?.renewal_premium || 0).toLocaleString()}`)
        doc.moveDown(2)

        // Proper Header Drawer
        const drawHeader = (startY: number) => {
            doc.font('Helvetica-Bold').fontSize(9)
            doc.text('Client', 30, startY)
            doc.text('Type', 160, startY)
            doc.text('Flow', 250, startY)
            doc.text('Premium', 320, startY)
            doc.text('CSR', 400, startY)
            doc.text('Date', 500, startY)
            doc.moveTo(30, startY + 12).lineTo(570, startY + 12).stroke()
            return startY + 20
        }

        let y = drawHeader(doc.y)
        doc.font('Helvetica').fontSize(8)

        data?.forEach((row: any) => {
            // Safe Page breaks
            if (y > 750) {
                doc.addPage()
                y = drawHeader(30)
                doc.font('Helvetica').fontSize(8)
            }

            const premium = row.total_premium || 0
            doc.text(row.client_name?.substring(0, 20) || '-', 30, y)
            doc.text(row.policy_type?.substring(0, 15) || '-', 160, y)
            doc.text(row.policy_flow || '-', 250, y)
            doc.text(`$${premium.toLocaleString()}`, 320, y)
            doc.text(row.assigned_csr_profile?.full_name?.substring(0, 15) || '-', 400, y)
            doc.text(row.effective_date || '-', 500, y)
            y += 18
        })

        doc.end()
        return new Response(readable, { headers })
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
}
