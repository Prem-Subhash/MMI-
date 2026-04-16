import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import ExcelJS from 'exceljs'

// 1. Zod Input Validation
const ReportSchema = z.object({
    month: z.string().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD required").optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD required").optional(),
    date_type: z.enum(['effective', 'expiration']).default('effective'),
    policy_flow: z.enum(['new', 'renewal', 'all', '']).optional(),
    insurence_category: z.enum(['personal', 'commercial', 'all', '']).optional(),
    line_of_businesses: z.array(z.string()).optional(),
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

    const body = await request.json()
    const parseResult = ReportSchema.safeParse(body)

    if (!parseResult.success) {
        return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 })
    }

    let { month, start_date, end_date, date_type, policy_flow, insurence_category, line_of_businesses, assigned_csr, customer_name, page, limit, exportType } = parseResult.data

    // 2. Date Parsing
    if (month && !start_date && !end_date) {
        start_date = `${month}-01`
        const [y, m] = month.split('-')
        const firstDayNextMonth = new Date(parseInt(y), parseInt(m), 1)
        const lastDay = new Date(firstDayNextMonth.getTime() - 86400000)
        end_date = lastDay.toISOString().split('T')[0]
    }

    if (!start_date || !end_date) {
        return NextResponse.json({ error: 'Valid date range is required.' }, { status: 400 });
    }

    const safeFlow = policy_flow === 'all' || policy_flow === '' ? null : policy_flow
    const safeCategory = insurence_category === 'all' || insurence_category === '' ? null : insurence_category
    const dateField = date_type === 'expiration' ? 'renewal_date' : 'effective_date'

    // 3. Fetch KPI Summary
    const { data: summaryData, error: summaryError } = await supabase.rpc('get_report_summary', {
        p_start_date: start_date,
        p_end_date: end_date,
        p_date_type: date_type,
        p_flow: safeFlow,
        p_category: safeCategory,
        p_csr: assigned_csr || null
    })

    if (summaryError) {
        console.error('Summary Error:', summaryError)
    }

    // 4. Base Query Builder
    let query = supabase
        .from('temp_leads_basics')
        .select(`
            id,
            client_name,
            policy_type,
            effective_date,
            renewal_date,
            created_at,
            carrier,
            total_premium,
            policy_number,
            policy_flow,
            insurence_category,
            assigned_csr,
            assigned_csr_profile:csrs!temp_leads_assigned_csr_fkey (name),
            assigned_user_profile:profiles!assigned_csr (full_name)
        `, { count: 'exact' })
        .gte(dateField, start_date)
        .lte(dateField, end_date)

    if (safeFlow) query = query.eq('policy_flow', safeFlow)
    if (safeCategory) query = query.eq('insurence_category', safeCategory)
    if (line_of_businesses && line_of_businesses.length > 0) {
        query = query.in('policy_type', line_of_businesses)
    }
    if (assigned_csr) query = query.eq('assigned_csr', assigned_csr)
    if (customer_name) query = query.ilike('client_name', `%${customer_name}%`)

    query = query.order(dateField, { ascending: false })

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

    // 5. Handle Export
    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (exportType === 'excel') {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Enterprise Report')

        // Title and Summary Section at the Top
        worksheet.addRow(['Enterprise Reporting - Monthly Summary']).font = { bold: true, size: 16 }
        worksheet.addRow([`Period: ${start_date} to ${end_date}`])
        worksheet.addRow([])

        worksheet.addRow(['KPI Summary']).font = { bold: true, size: 12 }
        worksheet.addRow(['Metric', 'Value']).font = { bold: true }
        worksheet.addRow(['Total Policies', summaryData?.total_policies || 0])
        worksheet.addRow(['Total Premium', `$${(summaryData?.total_premium || 0).toLocaleString()}`])
        worksheet.addRow(['New Business Premium', `$${(summaryData?.new_business_premium || 0).toLocaleString()}`])
        worksheet.addRow(['Renewal Premium', `$${(summaryData?.renewal_premium || 0).toLocaleString()}`])
        worksheet.addRow(['Personal Lines', summaryData?.personal_line_count || 0])
        worksheet.addRow(['Commercial Lines', summaryData?.commercial_line_count || 0])
        worksheet.addRow([])

        // Data Table Headers
        const dateHeader = date_type === 'expiration' ? 'DATE (EXPIRATION)' : 'DATE (EFFECTIVE)'
        const dateKey = date_type === 'expiration' ? 'renewal_date' : 'effective_date'

        const tableHeaderRow = worksheet.addRow(['CLIENT', 'TYPE', 'CATEGORY', 'FLOW', 'PREMIUM', 'CSR', dateHeader])
        tableHeaderRow.font = { bold: true }
        tableHeaderRow.eachCell(cell => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF10B981' } // A green shade like the UI
            }
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
        })

        // Add lead data
        data?.forEach((row: any) => {
            worksheet.addRow([
                row.client_name || '-',
                row.policy_type || '-',
                row.insurence_category || '-',
                row.policy_flow || '-',
                row.total_premium ? `$${row.total_premium.toLocaleString()}` : '$0',
                row.assigned_csr_profile?.name || row.assigned_user_profile?.full_name || row.assigned_csr || '-',
                row[dateKey] || row.effective_date || '-'
            ])
        })

        worksheet.columns.forEach((column, i) => {
            column.width = i === 0 ? 30 : 20
        })

        const buffer = await workbook.xlsx.writeBuffer()
        return new Response(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Enterprise_Report_${start_date}_to_${end_date}.xlsx"`
            }
        })
    }

    if (exportType === 'pdf') {
        const PDFDocument = (await import('pdfkit')).default
        const doc = new PDFDocument({ margin: 30, size: 'A4' })

        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: any[] = []
            doc.on('data', (chunk) => chunks.push(chunk))
            doc.on('end', () => resolve(Buffer.concat(chunks)))
            doc.on('error', reject)

            try {
                const dateLabel = date_type === 'expiration' ? 'Renewal Date' : 'Effective Date'
                doc.fontSize(18).font('Helvetica-Bold').text('Enterprise Report', { align: 'center' })
                doc.fontSize(10).font('Helvetica').text(`Period: ${start_date} to ${end_date} (${dateLabel})`, { align: 'center' })
                doc.moveDown(2)

                doc.fontSize(12).font('Helvetica-Bold').text('KPI Summary')
                doc.fontSize(10).font('Helvetica')
                doc.text(`Total Policies: ${summaryData?.total_policies || 0}`)
                doc.text(`Total Premium: $${(summaryData?.total_premium || 0).toLocaleString()}`)
                doc.moveDown(2)

                const drawHeader = (startY: number) => {
                    doc.rect(30, startY - 5, 540, 20).fill('#10B981') // Green box for headers
                    doc.fillColor('white').font('Helvetica-Bold').fontSize(9)
                    doc.text('CLIENT', 35, startY)
                    doc.text('TYPE', 160, startY)
                    doc.text('CATEGORY', 240, startY)
                    doc.text('FLOW', 320, startY)
                    doc.text('PREMIUM', 380, startY)
                    doc.text('CSR', 460, startY)
                    doc.text('DATE', 530, startY)
                    doc.fillColor('black') // Reset color
                    return startY + 20
                }

                let y = drawHeader(doc.y)
                doc.font('Helvetica').fontSize(8)

                data?.forEach((row: any) => {
                    if (y > 750) {
                        doc.addPage()
                        y = drawHeader(30)
                        doc.font('Helvetica').fontSize(8)
                    }
                    const premium = row.total_premium || 0
                    const rowDate = date_type === 'expiration' ? (row.renewal_date || row.effective_date) : row.effective_date
                    
                    doc.text(row.client_name?.substring(0, 25) || '-', 35, y)
                    doc.text(row.policy_type?.substring(0, 20) || '-', 160, y)
                    doc.text(row.insurence_category || '-', 240, y)
                    doc.text(row.policy_flow || '-', 320, y)
                    doc.text(`$${premium.toLocaleString()}`, 380, y)
                    doc.text(row.assigned_csr_profile?.name?.substring(0, 15) || row.assigned_user_profile?.full_name?.substring(0, 15) || '-', 460, y)
                    doc.text(rowDate || '-', 530, y)
                    y += 18
                    doc.moveTo(30, y - 5).lineTo(570, y - 5).strokeColor('#E5E7EB').lineWidth(0.5).stroke().strokeColor('black')
                })
                doc.end()
            } catch (err) {
                reject(err)
            }
        })

        return new Response(new Uint8Array(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Enterprise_Report_${start_date}_to_${end_date}.pdf"`
            }
        })
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
}
