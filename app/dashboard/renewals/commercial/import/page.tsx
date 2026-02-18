'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CommercialRenewalImportPage() {
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const formatDate = (dateString: string) => {
        if (!dateString) return null
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString

        const clean = dateString.trim()
        if (clean.includes('/')) {
            const parts = clean.split('/')
            if (parts.length === 3) {
                let [m, d, y] = parts
                m = m.padStart(2, '0')
                d = d.padStart(2, '0')
                if (y.length === 2) y = '20' + y
                return `${y}-${m}-${d}`
            }
        }
        if (clean.includes('-')) {
            const parts = clean.split('-')
            if (parts.length === 3) {
                if (parts[0].length === 4) return clean
                const [d, m, y] = parts
                return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
            }
        }
        return null
    }

    const handleFileUpload = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: result => setRows(result.data as any[]),
        })
    }

    const handleImport = async () => {
        setLoading(true)
        setMessage(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setMessage('Not logged in')
            setLoading(false)
            return
        }

        const { data: pipeline, error: pipelineError } = await supabase
            .from('pipelines')
            .select('id')
            .eq('name', 'Commercial Lines Renewal Pipeline')
            .single()

        if (pipelineError || !pipeline) {
            setMessage('Commercial Lines Renewal Pipeline not found. Please run migration.')
            setLoading(false)
            return
        }

        const { data: stage, error: stageError } = await supabase
            .from('pipeline_stages')
            .select('id')
            .eq('pipeline_id', pipeline.id)
            .order('stage_order', { ascending: true })
            .limit(1)
            .single()

        if (stageError || !stage) {
            setMessage('First stage not found')
            setLoading(false)
            return
        }

        const payload: any[] = []
        const errors: string[] = []

        rows.forEach((r, index) => {
            const renewalDate = formatDate(r['Renewal Date'])

            if (!renewalDate) {
                errors.push(`Row ${index + 1}: Missing or invalid Renewal Date`)
                return
            }

            payload.push({
                business_name: r['Business Name']?.trim() || r['Client Name']?.trim(),
                client_name: r['Client Name']?.trim() || r['Business Name']?.trim(),
                policy_type: r['Policy Type']?.trim(),
                renewal_date: renewalDate,
                carrier: r['Carrier']?.trim(),
                policy_number: r['Policy Number']?.trim(),
                total_premium: r['Total Premium'] ? Number(r['Total Premium']) : null,
                renewal_premium: r['Renewal Premium'] ? Number(r['Renewal Premium']) : null,
                referral: r['Referral']?.trim() || null,
                notes: r['Notes']?.trim() || null,
                policy_flow: 'renewal',
                insurence_category: 'commercial',
                pipeline_id: pipeline.id,
                current_stage_id: stage.id,
                assigned_csr: user.id,
            })
        })

        if (payload.length === 0) {
            setMessage(errors.length > 0 ? `All rows failed validation. ${errors[0]}` : 'No data found.')
            setLoading(false)
            return
        }

        const { error } = await supabase
            .from('temp_leads_basics')
            .insert(payload)

        if (error) {
            setMessage(`Import failed: ${error.message}`)
        } else {
            const msg = `Successfully imported ${payload.length} renewals.` + (errors.length > 0 ? ` (${errors.length} skipped)` : '')
            setMessage(msg)
            if (errors.length === 0) setRows([])
        }

        setLoading(false)
    }

    return (
        <div className="p-8 max-w-xl">
            <div className="mb-6">
                <Link
                    href="/dashboard/renewals/commercial"
                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors mb-4"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Commercial Renewals
                </Link>
                <h1 className="text-xl font-bold mb-2">
                    Import Commercial Renewals
                </h1>
            </div>

            <div className="mb-4 bg-blue-50 p-4 rounded text-sm text-blue-800">
                <strong>Required CSV Columns:</strong>
                <ul className="list-disc pl-5 mt-1">
                    <li>Business Name (or Client Name)</li>
                    <li>Policy Type</li>
                    <li>Renewal Date (YYYY-MM-DD)</li>
                    <li>Carrier</li>
                    <li>Policy Number</li>
                    <li>Total Premium</li>
                    <li>Renewal Premium (Optional)</li>
                </ul>
            </div>

            <input
                type="file"
                accept=".csv"
                onChange={e =>
                    e.target.files && handleFileUpload(e.target.files[0])
                }
            />

            {rows.length > 0 && (
                <button
                    onClick={handleImport}
                    disabled={loading}
                    className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition"
                >
                    {loading ? 'Importing…' : `Import ${rows.length} Rows`}
                </button>
            )}

            {message && (
                <div className="mt-4 p-4 bg-gray-100 rounded whitespace-pre-line text-sm border border-gray-200">
                    {message}
                </div>
            )}
        </div>
    )
}
