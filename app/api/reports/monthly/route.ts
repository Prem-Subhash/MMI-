import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
// import PDFDocument from 'pdfkit' // We'll handle this dynamically or use a different approach if needed, but pdfkit is standard for node.

export async function POST(request: Request) {
    const cookieStore = cookies()

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

    // 1. Auth Check
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const body = await request.json()
    const {
        month,
        policy_type,
        insurence_category,
        customer_name,
        assigned_csr,
        policy_flow,
        exportType // 'json', 'excel', 'pdf'
    } = body

    // 2. RBAC: Get User Role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, manager_id')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        // Fallback if no profile: treat as agent (strict)
        console.error('Profile not found', profileError)
        return NextResponse.json({ error: 'Profile not found. Contact admin.' }, { status: 403 })
    }

    const role = profile.role

    // 3. Build Query
    let query = supabase
        .from('temp_leads_basics')
        .select(`
      id,
      client_name,
      policy_type,
      renewal_date,
      created_at,
      carrier,
      total_premium,
      policy_number,
      policy_flow,
      insurence_category,
      assigned_csr,
      assigned_csr_profile:profiles!assigned_csr (full_name)
    `)

    // 4. Apply Filters
    if (month) {
        // month is YYYY-MM
        const startDate = `${month}-01`
        const [y, m] = month.split('-')
        // Calculate end date
        const date = new Date(parseInt(y), parseInt(m), 0) // last day of month
        const endDate = date.toISOString().split('T')[0]

        // Filter by created_at for new business, renewal_date for renewals?
        // Requirement says: "policy_buying_date (month range)"
        // We'll use created_at for 'new' and renewal_date for 'renewal' OR just use a generic date field if we had one.
        // For now, let's assume we filter on created_at for ALL, or split logic.
        // Actually, usually reports are based on "Effective Date". We don't have effective date explicitly, maybe renewal_date?
        // Let's use logic: if policy_flow = renewal -> use renewal_date. If new -> use created_at (or we should add effective_date).
        // Given the constraints, let's filter based on policy_flow if specific, or general.
        // Simplified: "policy_buying_date" requested. Let's assume we use `renewal_date` for everything for now as primary date, 
        // or `created_at` if renewal_date is null.
        // A better approach for a report:
        // .or(`renewal_date.gte.${startDate},created_at.gte.${startDate}`) -- too complex.
        // Let's stick to: if renewal_date exists, use it.

        // User requirement: "policy_buying_date (month range)"
        // We don't have this column. We'll use `renewal_date` for now as primary metric for "when business happens".
        query = query.gte('renewal_date', startDate).lte('renewal_date', endDate)
    }

    if (policy_type) query = query.eq('policy_type', policy_type)
    if (insurence_category) query = query.eq('insurence_category', insurence_category)
    if (policy_flow) query = query.eq('policy_flow', policy_flow)
    if (customer_name) query = query.ilike('client_name', `%${customer_name}%`)

    // 5. Apply RBAC Filters (Server-side Enforcement)
    if (role === 'admin') {
        // No extra filter. Can filter by specific CSR if requested.
        if (assigned_csr) query = query.eq('assigned_csr', assigned_csr)
    } else if (role === 'manager') {
        // Show self + team
        // Get team members
        const { data: team } = await supabase
            .from('profiles')
            .select('id')
            .or(`manager_id.eq.${user.id},id.eq.${user.id}`)

        const teamIds = team?.map(t => t.id) || [user.id]

        if (assigned_csr) {
            // If filtering by specific CSR, ensure they are in team
            if (!teamIds.includes(assigned_csr)) {
                return NextResponse.json({ error: 'Access denied to this CSR data' }, { status: 403 })
            }
            query = query.eq('assigned_csr', assigned_csr)
        } else {
            query = query.in('assigned_csr', teamIds)
        }
    } else {
        // Agent: Only see own
        if (assigned_csr && assigned_csr !== user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
        query = query.eq('assigned_csr', user.id)
    }

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 6. Handle Export
    if (exportType === 'excel') {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Monthly Report')

        worksheet.columns = [
            { header: 'Client Name', key: 'client_name', width: 20 },
            { header: 'Policy Type', key: 'policy_type', width: 20 },
            { header: 'Category', key: 'insurence_category', width: 15 },
            { header: 'Flow', key: 'policy_flow', width: 10 },
            { header: 'Premium', key: 'total_premium', width: 15 },
            { header: 'CSR', key: 'csr', width: 20 },
            { header: 'Date', key: 'date', width: 15 },
        ]

        data?.forEach((row: any) => {
            worksheet.addRow({
                client_name: row.client_name,
                policy_type: row.policy_type,
                insurence_category: row.insurence_category,
                policy_flow: row.policy_flow,
                total_premium: row.total_premium,
                csr: row.assigned_csr_profile?.full_name || row.assigned_csr,
                date: row.renewal_date || row.created_at
            })
        })

        const buffer = await workbook.xlsx.writeBuffer()

        return new Response(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="Monthly_Report_${month || 'All'}.xlsx"`
            }
        })
    }

    if (exportType === 'pdf') {
        const PDFDocument = require('pdfkit')

        // Create a new PDF document
        const doc = new PDFDocument({ margin: 30, size: 'A4' })

        // Stream appropriate headers
        const headers = new Headers()
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `attachment; filename="Monthly_Report_${month || 'All'}.pdf"`)

        // Create a TransformStream to pipe the PDF into
        const { readable, writable } = new TransformStream()
        const writer = writable.getWriter()

        doc.pipe({
            write: (chunk: any) => writer.write(chunk),
            end: () => writer.close(),
            on: (event: string, listener: any) => { },
            once: (event: string, listener: any) => { },
            emit: (event: string, ...args: any[]) => true,
        } as any)

        // --- PDF CONTENT ---

        // Title
        doc.fontSize(20).text(`Monthly Report: ${month || 'All Time'}`, { align: 'center' })
        doc.moveDown()

        // Filter Summary
        doc.fontSize(10).text(`Generated by: ${user.email}`)
        doc.text(`Date: ${new Date().toLocaleDateString()}`)
        doc.moveDown()

        // Table Header
        const tableTop = 150
        const colX = {
            client: 30,
            type: 150,
            premium: 280,
            csr: 380,
            date: 480
        }

        doc.font('Helvetica-Bold')
        doc.text('Client', colX.client, tableTop)
        doc.text('Type', colX.type, tableTop)
        doc.text('Premium', colX.premium, tableTop)
        doc.text('CSR', colX.csr, tableTop)
        doc.text('Date', colX.date, tableTop)

        doc.moveTo(30, tableTop + 15).lineTo(570, tableTop + 15).stroke()

        // Table Rows
        let y = tableTop + 25
        doc.font('Helvetica').fontSize(9)

        let totalPremium = 0

        data?.forEach((row: any) => {
            // Page Break if needed
            if (y > 750) {
                doc.addPage()
                y = 50
                // Re-draw header? simplified for now
            }

            const premium = row.total_premium || 0
            totalPremium += premium

            doc.text(row.client_name?.substring(0, 20) || '-', colX.client, y)
            doc.text(row.policy_type?.substring(0, 20) || '-', colX.type, y)
            doc.text(`$${premium.toLocaleString()}`, colX.premium, y)
            doc.text(row.assigned_csr_profile?.full_name?.substring(0, 15) || row.assigned_csr?.substring(0, 8) || '-', colX.csr, y)
            doc.text(row.renewal_date || row.created_at?.split('T')[0] || '-', colX.date, y)

            y += 20
        })

        doc.moveDown()
        doc.moveTo(30, y).lineTo(570, y).stroke()
        y += 10

        // Total
        doc.font('Helvetica-Bold').fontSize(12)
        doc.text(`Total Premium: $${totalPremium.toLocaleString()}`, colX.premium - 20, y)

        // End PDF
        doc.end()

        return new Response(readable, { headers })
    }

    return NextResponse.json(data)
}
