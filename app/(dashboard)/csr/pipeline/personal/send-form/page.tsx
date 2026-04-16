'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft } from 'lucide-react'
import EmailGenerator from '@/components/email/EmailGenerator'

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
}

const templateLabels: Record<string, string> = {
  info_req: "Information Request",
  new_lead: "Send Quote",
  renewal_same: "Renewal (Same Carrier)",
  renewal_switch: "Renewal (Switch Carrier)",
  congrats_new: "Congratulations (New Client)",
  congrats_existing: "Congratulations (Existing Client)",
  follow_up: "Follow-Up",
  auto_payment: "Automatic Payment Confirmation",
  payment_reminder: "Payment Reminder"
}

const templateGroups = [
  { label: "Lead Stage", items: ["info_req", "new_lead"] },
  { label: "Renewal", items: ["renewal_same", "renewal_switch"] },
  { label: "Closing", items: ["congrats_new", "congrats_existing"] },
  { label: "Follow-Up", items: ["follow_up"] },
  { label: "Payments", items: ["auto_payment", "payment_reminder"] }
]

export default function SendFormPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const leadId = searchParams.get('id')

  const [lead, setLead] = useState<any>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [formType, setFormType] = useState('home')
  const [customSubject, setCustomSubject] = useState('')
  const [generatedBody, setGeneratedBody] = useState('')
  const [notes, setNotes] = useState('')
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
        .eq('policy_type', formType)

      if (templateError) {
        setError(templateError.message)
        setLoading(false)
        return
      }

      setLead(leadData)
      
      const uniqueTemplates = (templateData || []).reduce((acc: EmailTemplate[], current) => {
        if (current.name.toLowerCase().includes('umbrella')) return acc;
        const cleanName = current.name.replace(/^Personal\s+/i, '');
        const x = acc.find(item => item.name === cleanName);
        if (!x) return acc.concat([{ ...current, name: cleanName }]);
        return acc;
      }, []);

      setTemplates(uniqueTemplates)
      console.log("DEBUG: FormType:", formType);
      console.log("DEBUG: Templates Updated:", uniqueTemplates);
      setLoading(false)
    }

    loadData()
  }, [leadId, formType])

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

    // Production Final Combination: Only add HR if notes exist
    const finalBody = notes.trim() 
      ? `${generatedBody}<br><br><hr><br><br>${notes.replace(/\n/g, '<br>')}` 
      : generatedBody;

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        templateId,
        formType,
        intakeId,
        customSubject,
        customBody: finalBody,
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

  if (loading) return <div className="p-10">Loading…</div>

  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-6 py-5 md:px-8 md:py-6">
            <h1 className="text-xl md:text-2xl font-bold text-white">Send Initial Email (Pipeline)</h1>
            <p className="text-white/80 text-xs md:text-sm mt-1">
              Configure and send the onboarding email for this pipeline entry.
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6 md:space-y-8">
            <div className="bg-gray-50 rounded-xl p-5 md:p-6 border border-gray-100">
              <h3 className="text-[#2E5C85] font-bold mb-4 text-[10px] md:text-xs uppercase tracking-widest">
                Client Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 md:gap-y-6 gap-x-8">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Client Name</p>
                  <p className="text-gray-900 font-bold text-sm md:text-base">{lead.client_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-gray-900 font-bold text-sm md:text-base break-all">{lead.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Phone</p>
                  <p className="text-gray-900 font-bold text-sm md:text-base">{lead.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Insurance Category</p>
                  <p className="text-gray-900 font-bold text-sm md:text-base capitalize">{lead.insurence_category}</p>
                </div>
              </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            <div className="space-y-6">
              <button
                onClick={handlePreview}
                className="w-full py-4 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                <span>Preview Form (CSR View)</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* TEMPLATE SELECT */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Email Purpose ({formType === 'auto' ? 'Auto Insurance' : 'Home Insurance'})
                      </label>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-tighter shadow-sm ${formType === 'auto' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-[#10B889]/10 text-[#10B889] border border-[#10B889]/20'}`}>
                        {formType}
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={templateId}
                        onChange={e => setTemplateId(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] transition-all text-sm font-medium shadow-sm"
                        disabled={templates.length === 0}
                      >
                        {templates.length === 0 ? (
                          <option value="">No templates available</option>
                        ) : (
                          <>
                            <option value="">Select Email Type</option>
                            {templateGroups.map(group => {
                              const groupTemplates = templates.filter(t => group.items.includes(t.name));
                              if (groupTemplates.length === 0) return null;
                              
                              return (
                                <optgroup key={group.label} label={group.label}>
                                  {groupTemplates.map(t => (
                                    <option key={t.id} value={t.id}>
                                      {templateLabels[t.name] || t.name}
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            })}
                          </>
                        )}
                      </select>
                      <p className="mt-1 text-[10px] text-gray-400 font-medium ml-1 flex items-center gap-1">
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        Showing only {formType === 'auto' ? 'Auto' : 'Home'} Insurance templates
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Form Type</label>
                    <div className="relative">
                      <select
                        value={formType}
                        onChange={e => setFormType(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] transition-all text-sm font-medium shadow-sm"
                      >
                         <option value="home">Home</option>
                         <option value="auto">Auto</option>
                         <option value="condo">Condo</option>
                         <option value="landlord_home">Landlord Home</option>
                      </select>
                    </div>
                  </div>
                </div>

                <EmailGenerator
                  templates={templates}
                  templateId={templateId}
                  setTemplateId={setTemplateId}
                  initialClientName={lead.client_name}
                  customSubject={customSubject}
                  generatedBody={generatedBody}
                  setGeneratedBody={setGeneratedBody}
                  notes={notes}
                  setNotes={setNotes}
                  setCustomSubject={setCustomSubject}
                  formType={formType}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => router.back()}
                  className="w-full sm:w-1/3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-4 rounded-xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} /> Back
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