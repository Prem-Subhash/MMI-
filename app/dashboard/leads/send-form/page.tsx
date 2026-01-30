'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
}

export default function SendFormPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leadId = searchParams.get('id')

  const [lead, setLead] = useState<any>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [formType, setFormType] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ================= LOAD LEAD + TEMPLATES ================= */
  useEffect(() => {
    if (!leadId) return

    const loadData = async () => {
      setLoading(true)
      setError(null)

      const { data: leadData, error: leadError } = await supabase
        .from('temp_leads_basics')
        .select(`
          id,
          client_name,
          phone,
          email,
          insurence_category,
          policy_type,
          policy_flow,
          created_at
        `)
        .eq('id', leadId)
        .single()

      if (leadError) {
        setError(leadError.message)
        setLoading(false)
        return
      }

      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)

      if (templateError) {
        setError(templateError.message)
        setLoading(false)
        return
      }

      setLead(leadData)
      setTemplates(templateData || [])
      setLoading(false)
    }

    loadData()
  }, [leadId])

  /* ================= ENSURE INTAKE FORM ================= */
  const ensureIntakeForm = async () => {
    if (!leadId || !formType) return null

    const { data: existing } = await supabase
      .from('temp_intake_forms')
      .select('id')
      .eq('lead_id', leadId)
      .eq('form_type', formType)
      .maybeSingle()

    if (existing?.id) return existing.id

    const { data, error } = await supabase
      .from('temp_intake_forms')
      .insert({
        lead_id: leadId,
        form_type: formType,
        status: 'sent',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    return data.id
  }

  /* ================= PREVIEW ================= */
  const handlePreview = async () => {
    if (!formType) {
      setError('Select form type first')
      return
    }

    const id = await ensureIntakeForm()
    if (!id) return

    window.open(`/dashboard/intake/${id}?preview=true`, '_blank')
  }

  /* ================= SEND EMAIL ================= */
  const handleSend = async () => {
    if (!templateId || !formType) {
      setError('Select template and form type')
      return
    }

    if (!lead?.email) {
      setError('Client email is missing')
      return
    }

    setSending(true)
    setError(null)

    const intakeId = await ensureIntakeForm()
    if (!intakeId) {
      setSending(false)
      return
    }

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        templateId,
        formType,
      }),
    })

    if (!res.ok) {
      const result = await res.json()
      setError(result?.error || 'Failed to send email')
      setSending(false)
      return
    }

    router.push('/dashboard/leads')
  }

  /* ================= UI STATES ================= */
  if (loading) return <div className="p-10">Loading…</div>

  /* ================= UI ================= */
  return (
    <div className="max-w-4xl mx-auto p-10">
      {/* CARD CONTAINER */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Send Initial Email</h1>
          <p className="text-white/80 text-sm mt-1">
            Configure and send the onboarding email to the client.
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* LEAD SUMMARY GRID */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h3 className="text-[#2E5C85] font-bold mb-4 text-sm uppercase tracking-wider">
              Client Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Client Name
                </p>
                <p className="text-gray-900 font-medium">{lead.client_name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Email
                </p>
                <p className="text-gray-900 font-medium" title={lead.email}>
                  {lead.email}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Phone
                </p>
                <p className="text-gray-900 font-medium">{lead.phone}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Insurance Category
                </p>
                <p className="text-gray-900 font-medium capitalize">
                  {lead.insurence_category}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Policy Type
                </p>
                <p className="text-gray-900 font-medium capitalize">
                  {lead.policy_type}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Policy Flow
                </p>
                <p className="text-gray-900 font-medium capitalize">
                  {lead.policy_flow}
                </p>
              </div>
            </div>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700 text-sm">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* ACTION FORM */}
          <div className="space-y-6">
            {/* PREVIEW BUTTON */}
            <button
              onClick={handlePreview}
              className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl shadow transition-all flex items-center justify-center gap-2 group"
            >
              <span>Preview Form (CSR View)</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TEMPLATE SELECT */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Email Template
                </label>

                <div className="relative">
                  <select
                    value={templateId}
                    onChange={e => setTemplateId(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#10B889] focus:border-transparent transition-shadow"
                  >
                    <option value="">Select Email Template</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* FORM TYPE SELECT */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Form Type
                </label>

                <div className="relative">
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#10B889] focus:border-transparent transition-shadow"
                  >
                    <option value="">Select Form Type</option>
                    <option value="home">Home</option>
                    <option value="auto">Auto</option>
                    <option value="condo">Condo</option>
                    <option value="landlord_home">Landlord Home</option>
                  </select>

                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="px-8 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                Back
              </button>

              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-gradient-to-r from-[#2E5C85] to-[#10B889] hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-[0.99] transition-all disabled:opacity-60"
              >
                {sending ? 'Sending…' : 'Send Initial Email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}