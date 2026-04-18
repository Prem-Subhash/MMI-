'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft } from 'lucide-react'
import { toast } from '@/lib/toast'
import EmailGenerator from '@/components/email/EmailGenerator'

import Loading from '@/components/ui/Loading'

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
  const [composeMode, setComposeMode] = useState<'template' | 'manual'>('template')
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

      const isRenewal = leadData.policy_flow === 'renewal';
      if (isRenewal && !leadData.policy_type) {
        console.warn('Missing policy_type for renewal', leadData);
      }
      const dynamicPolicyFlow = isRenewal ? 'renewal' : 'lead';
      const dynamicPolicyType = isRenewal ? (leadData.policy_type?.toLowerCase() || 'auto') : formType;

      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .eq('policy_flow', dynamicPolicyFlow)
        .eq('policy_type', dynamicPolicyType)

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
    // 1. Determine safe template ID (Requirement 5)
    const safeTemplateId = templateId || (templates?.length ? templates[0].id : null);

    if (!safeTemplateId) {
      setError('No valid email template found. Please try again later.');
      return;
    }

    if (!lead?.email) {
      setError('Client email is missing');
      return;
    }

    // 2. Validation for Manual Mode (Requirement 8)
    if (composeMode === 'manual') {
      if (!customSubject.trim()) {
        setError('Subject is required for manual emails');
        return;
      }
      if (!customBody.trim()) {
        setError('Email body cannot be empty');
        return;
      }
    } else if (!templateId) {
      setError('Select an email template');
      return;
    }

    setSending(true)
    setError(null)

    const intakeId = formType ? await ensureIntakeForm() : null;

    if (formType && !intakeId) {
      setSending(false)
      setError('Failed to generate Intake Form link. Please try again.')
      return
    }

    // 3. Format Body (Requirement 6)
    const formattedBody = composeMode === 'manual'
      ? customBody.replace(/\n/g, '<br>')
      : generatedBody;

    // Production Final Combination: Only add HR if notes exist (Template mode)
    const finalBody = (composeMode === 'template' && notes.trim())
      ? `${formattedBody}<br><br><hr><br><br>${notes.replace(/\n/g, '<br>')}`
      : formattedBody;

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        templateId: safeTemplateId, // Use Requirement 5 safe ID
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

    toast(result.message || 'Email sent successfully to the client.', 'success')
    router.push('/csr/leads')
  }

  /* ================= UI STATES ================= */
  if (loading) return <Loading message="Fetching lead details..." />


  const isRenewal = lead?.policy_flow === 'renewal';

  /* ================= UI ================= */
  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* CARD CONTAINER */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-6 py-5 md:px-8 md:py-6">
            <h1 className="text-xl md:text-2xl font-bold text-white">{isRenewal ? 'Send Renewal Email' : 'Send Initial Email'}</h1>
            <p className="text-white/80 text-xs md:text-sm mt-1">
              {isRenewal ? 'Configure and send renewal quotes to the client.' : 'Configure and send the onboarding email to the client.'}
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6 md:space-y-8">
            {/* CLIENT INFORMATION SUMMARY */}
            <div className="bg-white rounded-[1.5rem] p-8 md:p-10 border border-gray-100 shadow-lg relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Client Summary</h3>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Lead Verification Details</p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-100">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                  Verified Lead
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Client Name */}
                <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                   <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                   </div>
                   <div className="space-y-1 overflow-hidden">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name</p>
                     <p className="text-lg font-semibold text-gray-900 truncate tracking-tight leading-none">{lead.client_name}</p>
                   </div>
                </div>

                {/* 2. Email */}
                <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                   <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                   </div>
                   <div className="space-y-1 overflow-hidden">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
                     <p className="text-lg font-semibold text-gray-900 truncate tracking-tight leading-none" title={lead.email}>{lead.email}</p>
                   </div>
                </div>

                {/* 3. Phone */}
                <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                   <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                   </div>
                   <div className="space-y-1 overflow-hidden">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</p>
                     <p className="text-lg font-semibold text-gray-900 truncate tracking-tight leading-none">{lead.phone}</p>
                   </div>
                </div>

                {/* 4. Business Category */}
                <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                   <div className="w-11 h-11 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                   </div>
                   <div className="space-y-1 overflow-hidden">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Line of Business</p>
                     <p className="text-lg font-semibold text-gray-900 truncate tracking-tight leading-none capitalize">{lead.insurence_category}</p>
                   </div>
                </div>

                {/* 5. Policy Type */}
                <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                   <div className="w-11 h-11 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                   </div>
                   <div className="space-y-1 overflow-hidden">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Policy Type</p>
                     <p className="text-lg font-semibold text-gray-900 truncate tracking-tight leading-none capitalize">{lead.policy_type}</p>
                   </div>
                </div>

                {/* 6. Workflow */}
                <div className="flex items-center gap-4 p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                   <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                   </div>
                   <div className="space-y-1 overflow-hidden">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Workflow</p>
                     <p className="text-lg font-semibold text-gray-900 truncate tracking-tight leading-none capitalize">{lead.policy_flow}</p>
                   </div>
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
              {/* MODE TOGGLE */}
              <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-fit">
                <button
                  onClick={() => setComposeMode('template')}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${composeMode === 'template' ? 'bg-white text-[#2E5C85] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Template Mode
                </button>
                <button
                  onClick={() => setComposeMode('manual')}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${composeMode === 'manual' ? 'bg-white text-[#2E5C85] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Manual Email
                </button>
              </div>

              {/* PREVIEW BUTTON (Hide in manual mode) */}
              {!isRenewal && composeMode === 'template' && (
                <button
                  onClick={handlePreview}
                  className="w-full flex items-center justify-between gap-3 bg-[#2E5C85] border border-gray-200 rounded-xl px-5 py-3.5 cursor-pointer shadow-sm hover:bg-[#2E5C85]/80 transition-colors"
                >
                  <div className="flex items-center gap-3 bg">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                    <div className="text-left ">
                      <p className="text-white font-bold text-sm leading-tight">Preview Form</p>
                      <p className="text-white text-xs font-medium mt-0.5">Open a CSR view of the intake form in a new tab</p>
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </button>
              )}

              <div className="space-y-6">
                {composeMode === 'template' && (
                  <div className={`grid grid-cols-1 ${!isRenewal ? 'md:grid-cols-2' : ''} gap-6`}>
                    {/* TEMPLATE SELECT */}
                    <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1 h-5">
                      <label className="text-[10px] font-bold text-black uppercase tracking-widest">
                        {isRenewal ? 'Renewal Email' : `Email Purpose (${formType === 'auto' ? 'Auto Insurance' : 'Home Insurance'})`}
                      </label>
                      {!isRenewal && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-tighter shadow-sm ${formType === 'auto' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-[#10B889]/10 text-[#10B889] border border-[#10B889]/20'}`}>
                          {formType}
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <select
                        value={templateId}
                        onChange={e => setTemplateId(e.target.value)}
                        className="peer w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] transition-all text-sm font-medium shadow-sm text-gray-900"
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
                      <p className="mt-1 text-[10px] text-black font-medium ml-1">
                        Showing only {formType === 'auto' ? 'Auto' : 'Home'} Insurance templates
                      </p>

                      <div className="pointer-events-none absolute top-3.5 right-0 flex items-center px-4 text-black transition-transform duration-200 peer-focus:rotate-180">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                    </div>

                  {/* FORM TYPE SELECT (REQUIRED FOR INTAKE FORMS) */}
                  {!isRenewal && (
                    <div className="space-y-2">
                      <div className="flex items-center ml-1 h-5">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest">
                          Form Type
                        </label>
                      </div>

                      <div className="relative">
                        <select
                          value={formType}
                          onChange={e => setFormType(e.target.value)}
                          className="peer w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] transition-all text-sm font-medium shadow-sm text-gray-900"
                        >
                          <option value="">Select Form Type</option>
                          <option value="home">Home</option>
                          <option value="auto">Auto</option>
                          <option value="condo">Condo</option>
                          <option value="landlord_home">Landlord Home</option>
                        </select>

                        <div className="pointer-events-none absolute top-3.5 right-0 flex items-center px-4 text-black transition-transform duration-200 peer-focus:rotate-180">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

                {/* SECTION DIVIDER */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-black" />
                  <span className="text-[10px] font-bold text-black uppercase tracking-widest px-1">
                    {composeMode === 'manual' ? 'Manual Composition' : 'Email Configuration'}
                  </span>
                  <div className="flex-1 h-px bg-black" />
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
                  leadData={lead}
                  composeMode={composeMode}
                  customBody={customBody}
                  setCustomBody={setCustomBody}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => router.back()}
                  className="w-full sm:w-1/3 bg-[#10B889] border border-gray-200 text-white hover:bg-[#10B889]/80 font-bold py-4 rounded-xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>

                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full sm:w-2/3 bg-gradient-to-r from-[#2E5C85] to-[#10B889] hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-[0.99] transition-all disabled:opacity-60"
                >
                  {sending ? 'Sending…' : isRenewal ? 'Send Renewal Email' : 'Send Initial Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
