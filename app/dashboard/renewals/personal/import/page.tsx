'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PersonalRenewalImportPage() {
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

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setMessage('Not logged in')
            setLoading(false)
            return
        }

        const { data: pipeline, error: pipelineError } = await supabase
            .from('pipelines')
            .select('id')
            .eq('name', 'Personal Lines Renewal')
            .single()

        if (pipelineError || !pipeline) {
            setMessage('Personal Lines Renewal pipeline not found')
            setLoading(false)
            return
        }

        const { data: stage, error: stageError } = await supabase
            .from('pipeline_stages')
            .select('id')
            .eq('pipeline_id', pipeline.id)
            .eq('stage_order', 1)
            .single()

        if (stageError || !stage) {
            setMessage('First stage not found')
            setLoading(false)
            return
        }

        const payload = rows.map(r => ({
            client_name: r['Client Name']?.trim(),
            phone: r['Phone']?.trim(),
            email: r['Email']?.trim(),
            policy_type: r['Policy Type']?.trim(),
            renewal_date: formatDate(r['Renewal Date']),
            carrier: r['Carrier']?.trim(),
            policy_number: r['Policy Number']?.trim(),
            current_premium: r['Total Premium']
                ? Number(r['Total Premium'])
                : null,
            renewal_premium: r['Renewal Premium']
                ? Number(r['Renewal Premium'])
                : null,
            referral: r['Referral']?.trim() || null,
            notes: r['Notes']?.trim() || null,
            policy_flow: 'renewal',
            insurence_category: 'personal',
            pipeline_id: pipeline.id,
            current_stage_id: stage.id,
            assigned_csr: user.id,
        }))

        const { error } = await supabase
            .from('temp_leads_basics')
            .insert(payload)

        if (error) {
            setMessage(error.message)
        } else {
            setMessage('Personal Renewals imported successfully')
            setRows([])
        }

        setLoading(false)
    }

    return (
        <div className="p-8 max-w-xl">
            <div className="mb-6">
                <Link
                    href="/dashboard/renewals/personal"
                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors mb-4"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Personal Renewals
                </Link>
                <h1 className="text-xl font-bold mb-2">
                    Import Personal Lines Renewals
                </h1>
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
                    {loading ? 'Importing…' : 'Import'}
                </button>
            )}

            {message && (
                <p className="mt-4 text-sm text-blue-600">
                    {message}
                </p>
            )}
        </div>
    )
}
