'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import UpdateStageModal from '@/components/pipeline/UpdateStageModal'
import { ArrowLeft } from 'lucide-react'

export default function LeadReviewPage() {
  /* ================= ROUTER PARAMS ================= */
  const params = useParams<{ id: string }>()
  const leadId = params?.id
  const router = useRouter()

  /* ================= STATE ================= */
  const [lead, setLead] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  /* ================= LOAD LEAD + FORM ================= */
  useEffect(() => {
    if (!leadId) return

    const loadData = async () => {
      setLoading(true)
      setError(null)

      const { data: leadData, error: leadError } = await supabase
        .from('temp_leads_basics')
        .select(`
          *,
          pipeline_stages (
            id,
            stage_name
          )
        `)
        .eq('id', leadId)
        .single()

      if (leadError || !leadData) {
        setError('Lead not found')
        setLoading(false)
        return
      }

      const { data: formData } = await supabase
        .from('temp_intake_forms')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'completed')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setLead(leadData)
      setForm(formData || null)
      setLoading(false)
    }

    loadData()
  }, [leadId])

  /* ================= ACCEPT LEAD ================= */
  const handleAccept = async () => {
    if (!lead || !form) return

    setAccepting(true)
    setError(null)

    try {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', lead.email)
        .maybeSingle()

      let clientId = existingClient?.id

      if (!clientId) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            phone: lead.phone,
            email: lead.email,
            assigned_csr: lead.assigned_csr,
          })
          .select()
          .single()

        if (clientError || !client) {
          throw new Error('Failed to create client')
        }

        clientId = client.id
      }

      await supabase.from('client_insurance_details').insert({
        client_id: clientId,
        insurance_category: lead.insurence_category,
        policy_type: lead.policy_type,
        full_data: form.form_data,
        verified_by: lead.assigned_csr,
      })

      await supabase
        .from('temp_intake_forms')
        .update({
          status: 'reviewed',
          reviewed_by: lead.assigned_csr,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', form.id)

      router.push('/csr')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setAccepting(false)
    }
  }

  /* ================= UI STATES ================= */
  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading lead details...</div>
  }

  if (error) {
    return <div className="p-10 text-red-600 font-medium">{error}</div>
  }

  /* ================= NO FORM SUBMITTED ================= */
  if (!form) {
    return (
      <div className="max-w-4xl mx-auto p-10">
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Lead Details</h1>
            <p className="text-white/80 text-sm mt-1">
              Review lead information and pipeline status
            </p>
          </div>

          {/* CONTENT */}
          <div className="p-8 space-y-8">

            {/* DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Client Name */}
              <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none">Client Name</p>
                </div>
                <p className="text-[18px] font-black text-gray-900 truncate leading-tight pl-0.5">{lead.client_name || '—'}</p>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none">Email Address</p>
                </div>
                <p className="text-[18px] font-black text-gray-900 truncate leading-tight pl-0.5" title={lead.email}>{lead.email || '—'}</p>
              </div>

              {/* Policy Type */}
              <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none">Policy Type</p>
                </div>
                <p className="text-[18px] font-black text-gray-900 capitalize leading-tight pl-0.5">{lead.policy_type || '—'}</p>
              </div>

              {/* Current Status */}
              <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  <p className="text-[12px] font-black uppercase tracking-wider leading-none">Current Status</p>
                </div>
                <div className="flex items-center gap-2 pl-0.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,184,137,0.4)]" />
                  <p className="text-[18px] font-black text-gray-900 truncate leading-tight">
                    {lead.pipeline_stages?.stage_name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t pt-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm transition flex items-center gap-2 font-medium"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!lead.pipeline_id) {
                      alert('Pipeline not assigned to this lead')
                      return
                    }
                    setShowUpdateModal(true)
                  }}
                  className="px-6 py-2.5 bg-[#2E5C85] hover:bg-[#234b6e] text-white rounded-lg shadow transition"
                >
                  Update Status
                </button>
              </div>


            </div>

          </div>
        </div>

        {showUpdateModal && (
          <UpdateStageModal
            leadId={lead.id}
            pipelineId={lead.pipeline_id}
            onClose={() => setShowUpdateModal(false)}
            onSuccess={() => router.refresh()}
          />
        )}
      </div>
    )
  }

  /* ================= FORM SUBMITTED ================= */
  return (
    <div className="max-w-4xl mx-auto p-10 space-y-8">

      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Review Client Intake</h1>
          <p className="text-white/80 text-sm mt-1">
            Verify submitted information before accepting the lead
          </p>
        </div>

        <div className="p-8 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Client Name */}
            <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <p className="text-[12px] font-black uppercase tracking-wider leading-none">Client Name</p>
              </div>
              <p className="text-[18px] font-black text-gray-900 truncate leading-tight pl-0.5">{lead.client_name || '—'}</p>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <p className="text-[12px] font-black uppercase tracking-wider leading-none">Email Address</p>
              </div>
              <p className="text-[18px] font-black text-gray-900 truncate leading-tight pl-0.5" title={lead.email}>{lead.email || '—'}</p>
            </div>

            {/* Policy Type */}
            <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p className="text-[12px] font-black uppercase tracking-wider leading-none">Policy Type</p>
              </div>
              <p className="text-[18px] font-black text-gray-900 capitalize leading-tight pl-0.5">{lead.policy_type || '—'}</p>
            </div>

            {/* Current Status */}
            <div className="flex flex-col gap-1.5 p-4 bg-white border border-black rounded-2xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <p className="text-[12px] font-black uppercase tracking-wider leading-none">Current Status</p>
              </div>
              <div className="flex items-center gap-2 pl-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,184,137,0.4)]" />
                <p className="text-[18px] font-black text-gray-900 truncate leading-tight">
                  {lead.pipeline_stages?.stage_name || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg shadow-sm transition flex items-center gap-2 font-medium"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => {
                if (!lead.pipeline_id) {
                  alert('Pipeline not assigned to this lead')
                  return
                }
                setShowUpdateModal(true)
              }}
              className="px-5 py-2 bg-[#2E5C85] hover:bg-[#234b6e] text-white rounded-lg shadow"
            >
              Update Status
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Submitted Form Data</h2>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(form.form_data, null, 2)}
            </pre>
          </div>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium disabled:opacity-60"
          >
            {accepting ? 'Accepting Lead...' : 'Accept Lead'}
          </button>

        </div>
      </div>

      {showUpdateModal && (
        <UpdateStageModal
          leadId={lead.id}
          pipelineId={lead.pipeline_id}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}
