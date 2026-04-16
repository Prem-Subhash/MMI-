'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { Spinner } from '@/components/ui/Loading'

export default function PersonalRenewalImportPage() {
    const [rows, setRows] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)

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
        setFileName(file.name)
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: result => {
                setRows(result.data as any[])
                setMessage({ text: `${result.data.length} rows loaded. Ready to import.`, type: 'info' })
            },
        })
    }

    const handleImport = async () => {
        setLoading(true)
        setMessage(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setMessage({ text: 'Session expired. Please login again.', type: 'error' })
            setLoading(false)
            return
        }

        const { data: pipeline, error: pipelineError } = await supabase
            .from('pipelines')
            .select('id')
            .eq('name', 'Personal Lines Renewal')
            .single()

        if (pipelineError || !pipeline) {
            setMessage({ text: 'Personal Lines Renewal pipeline not found in system.', type: 'error' })
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
            setMessage({ text: 'Initial pipeline stage not found.', type: 'error' })
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
            current_premium: r['Total Premium'] ? Number(r['Total Premium']) : null,
            renewal_premium: r['Renewal Premium'] ? Number(r['Renewal Premium']) : null,
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
            .upsert(payload, {
                onConflict: 'policy_number,renewal_date'
            })

        if (error) {
            setMessage({ text: `Import failed: ${error.message}`, type: 'error' })
        } else {
            setMessage({ text: `Successfully imported ${payload.length} personal renewals.`, type: 'success' })
            setRows([])
            setFileName(null)
        }

        setLoading(false)
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/csr/renewals/personal"
                    className="group inline-flex items-center text-gray-400 hover:text-brand transition-colors mb-4 text-sm font-medium"
                >
                    <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
                    Back to Personal Renewals
                </Link>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand/10 rounded-2xl text-brand">
                        <FileSpreadsheet size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Import Personal Renewals
                        </h1>
                        <p className="text-gray-500 mt-1">Bulk upload leads into your personal renewal pipeline.</p>
                    </div>
                </div>
            </div>

            {/* Unified Card */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-2xl shadow-gray-200/50 overflow-hidden">
                <div className="p-8 md:p-10 space-y-10">
                    {/* Requirements Section */}
                    <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100/50">
                        <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Info size={16} />
                            Required CSV Columns
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            {[
                                'Client Name',
                                'Phone & Email',
                                'Policy Type',
                                'Renewal Date (YYYY-MM-DD)',
                                'Carrier & Policy Number',
                                'Total Premium',
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2.5 text-sm text-emerald-900 font-medium">
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-6">
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".csv"
                                id="file-upload"
                                className="hidden"
                                onChange={e => e.target.files && handleFileUpload(e.target.files[0])}
                            />
                            <label
                                htmlFor="file-upload"
                                className={`
                                    flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[24px] cursor-pointer transition-all
                                    ${fileName
                                        ? 'bg-emerald-50/20 border-emerald-200 text-emerald-900'
                                        : 'bg-gray-50/50 border-gray-200 hover:border-brand/40 hover:bg-brand/5 text-gray-500'}
                                `}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${fileName ? 'bg-emerald-100 text-emerald-600' : 'bg-white shadow-sm text-gray-400'}`}>
                                    <Upload size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-900 mb-1">
                                        {fileName ? fileName : 'Drag & drop your CSV file'}
                                    </p>
                                    <p className="text-sm">
                                        {fileName ? 'Click to change file' : 'or click to browse from computer'}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {rows.length > 0 && message?.type !== 'success' && (
                            <button
                                onClick={handleImport}
                                disabled={loading}
                                className="w-full bg-brand-dark hover:bg-brand text-white py-4 rounded-2xl font-bold shadow-xl shadow-brand/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                            >
                                {loading && <Spinner size={20} />}
                                {loading ? 'Importing Data...' : `Start Importing ${rows.length} Rows`}
                            </button>
                        )}

                        {message && (
                            <div className={`
                                p-6 rounded-2xl flex items-start gap-4 border animate-in slide-in-from-top-4
                                ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                                    message.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
                                        'bg-blue-50 border-blue-100 text-blue-800'}
                            `}>
                                {message.type === 'success' ? <CheckCircle2 className="shrink-0 text-emerald-500" /> :
                                    message.type === 'error' ? <AlertCircle className="shrink-0 text-red-500" /> :
                                        <Info className="shrink-0 text-blue-500" />}
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-wider mb-1 leading-none">{message.type}</p>
                                    <p className="text-sm font-medium opacity-90 leading-relaxed">{message.text}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
