'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft } from 'lucide-react'

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
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
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

      // Filter out duplicate templates by name
      const uniqueTemplates = (templateData || []).reduce((acc: EmailTemplate[], current) => {
        // Skip Umbrella templates
        if (current.name.toLowerCase().includes('umbrella')) {
          return acc;
        }

        // Remove "Personal " prefix
        const cleanName = current.name.replace(/^Personal\s+/i, '');
        
        const x = acc.find(item => item.name === cleanName);
        if (!x) {
          return acc.concat([{ ...current, name: cleanName }]);
        } else {
          return acc;
        }
      }, []);

      setTemplates(uniqueTemplates)
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

  /* ================= PREPARE CUSTOM EMAIL ================= */
  useEffect(() => {
    const prepareEmail = async () => {
      if (!templateId || !formType || !lead) {
        setCustomSubject('')
        setCustomBody('')
        return
      }

      const template = templates.find((t) => t.id === templateId)
      if (!template) return

      const intakeId = await ensureIntakeForm()
      if (!intakeId) return

      const formLink = `${window.location.origin}/intake/${intakeId}?type=${formType}`

      const replacedSubject = template.subject.replace(/{{\s*client_name\s*}}/g, lead.client_name || '')
      const replacedBody = template.body
        .replace(/{{\s*client_name\s*}}/g, lead.client_name || '')
        .replace(/{{\s*form_link\s*}}/g, formLink)

      setCustomSubject(replacedSubject)
      setCustomBody(replacedBody)
    }

    prepareEmail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, formType, lead])

  /* ================= PREVIEW ================= */
  const handlePreview = async () => {
    if (!formType) {
      setError('Select form type first')
      return
    }

    const id = await ensureIntakeForm()
    if (!id) return

    window.open(`/intake/${id}?preview=true`, '_blank')
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
        intakeId,
        customSubject,
        customBody,
      }),
    })

    const result = await res.json()

    if (!res.ok || !result.success) {
      setError(result?.error || result?.message || 'Email failed to send. Please try again.')
      setSending(false)
      return
    }

    alert(result.message || 'Email sent successfully to the client.')
    router.push('/csr/leads')
  }

  /* ================= UI STATES ================= */
  if (loading) return <div className="p-10">Loading…</div>

  /* ================= UI ================= */
  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* CARD CONTAINER */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-6 py-5 md:px-8 md:py-6">
            <h1 className="text-xl md:text-2xl font-bold text-white">Send Initial Email</h1>
            <p className="text-white/80 text-xs md:text-sm mt-1">
              Configure and send the onboarding email to the client.
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6 md:space-y-8">
            {/* LEAD SUMMARY GRID */}
            <div className="bg-gray-50 rounded-xl p-5 md:p-6 border border-gray-100">
              <h3 className="text-[#2E5C85] font-bold mb-4 text-[10px] md:text-xs uppercase tracking-widest">
                Client Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 md:gap-y-6 gap-x-8">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    Client Name
                  </p>
                  <p className="text-gray-900 font-bold text-sm md:text-base">{lead.client_name}</p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    Email
                  </p>
                  <p className="text-gray-900 font-bold text-sm md:text-base break-all" title={lead.email}>
                    {lead.email}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    Phone
                  </p>
                  <p className="text-gray-900 font-bold text-sm md:text-base">{lead.phone}</p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    Insurance Category
                  </p>
                  <p className="text-gray-900 font-bold text-sm md:text-base capitalize">
                    {lead.insurence_category}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    Policy Type
                  </p>
                  <p className="text-gray-900 font-bold text-sm md:text-base capitalize">
                    {lead.policy_type}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                    Policy Flow
                  </p>
                  <p className="text-gray-900 font-bold text-sm md:text-base capitalize">
                    {lead.policy_flow}
                  </p>
                </div>
              </div>
            </div>

            {/* ERROR ALERT */}
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            {/* ACTION FORM */}
            <div className="space-y-6">
              {/* PREVIEW BUTTON */}
              <button
                onClick={handlePreview}
                className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                <span>Preview Form (CSR View)</span>
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TEMPLATE SELECT */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Email Template
                  </label>

                  <div className="relative">
                    <select
                      value={templateId}
                      onChange={e => setTemplateId(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] transition-all text-sm font-medium"
                    >
                      <option value="">Select Email Template</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* FORM TYPE SELECT */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Form Type
                  </label>

                  <div className="relative">
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] transition-all text-sm font-medium"
                    >
                      <option value="">Select Form Type</option>
                      <option value="home">Home</option>
                      <option value="auto">Auto</option>
                      <option value="condo">Condo</option>
                      <option value="landlord_home">Landlord Home</option>
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {templateId && formType && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Subject</label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] text-sm font-medium transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Body</label>
                    <textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      rows={8}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] text-sm font-medium transition-all"
                    />
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => router.back()}
                  className="w-full sm:w-1/3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-4 rounded-xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>

                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full sm:w-2/3 bg-gradient-to-r from-[#2E5C85] to-[#10B889] hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-[0.99] transition-all disabled:opacity-60"
                >
                  {sending ? 'Sending…' : 'Send Initial Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
  )
}