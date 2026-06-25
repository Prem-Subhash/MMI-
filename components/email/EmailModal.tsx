'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/lib/toast'
import EmailGenerator from '@/components/email/EmailGenerator'
import Loading from '@/components/ui/Loading'

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
  policy_type?: string
  policy_flow?: string
  insurance_category?: string
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

interface EmailModalProps {
  leadId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EmailModal({ leadId, isOpen, onClose, onSuccess }: EmailModalProps) {
  const [lead, setLead] = useState<any>(null)
  const [csrData, setCsrData] = useState<any>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [formType, setFormType] = useState('home')
  const [isFormAttached, setIsFormAttached] = useState(false)
  const [hasTemplateFormLink, setHasTemplateFormLink] = useState(false)
  const [intakeId, setIntakeId] = useState<string | null>(null)
  const [formLink, setFormLink] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [generatedBody, setGeneratedBody] = useState('')
  const [notes, setNotes] = useState('')
  const [composeMode, setComposeMode] = useState<'template' | 'manual'>('template')
  const [customBody, setCustomBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePolicies, setActivePolicies] = useState<string[]>([])

  /* ================= UTILS ================= */
  const formatFormType = (type: string) => {
    if (!type) return 'Home';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  const getBadgeStyle = (type: string) => {
    if (type === 'auto' || type === 'motorcycle') return 'bg-blue-100 text-blue-600 border border-blue-200';
    if (type === 'umbrella') return 'bg-purple-100 text-purple-600 border border-purple-200';
    return 'bg-[#10B889]/10 text-[#10B889] border border-[#10B889]/20';
  }

  /* ================= LOAD LEAD + TEMPLATES ================= */
  useEffect(() => {
    if (!isOpen || !leadId) return

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
          lead_policies(policy_type),
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
      const dynamicPolicyType = (leadData.policy_type || 'auto').toLowerCase();
      const dynamicCategory = (leadData.insurence_category || 'personal').toLowerCase();

      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .eq('policy_flow', dynamicPolicyFlow)
        .eq('policy_type', dynamicPolicyType)
        .eq('insurance_category', dynamicCategory)

      if (templateError) {
        setError(templateError.message)
        setLoading(false)
        return
      }

      setLead(leadData)

      // Default formType based on policy_type
      if (!isRenewal && dynamicPolicyType) {
        setFormType(dynamicPolicyType);
      }

      // Fetch CSR data
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', authData.user.id)
          .single();
        if (profile) setCsrData(profile);
      }

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
      
      let policies = [leadData.policy_type || 'home'];
      if (leadData.lead_policies && leadData.lead_policies.length > 0) {
        policies = leadData.lead_policies.map((p: any) => p.policy_type);
      }
      setActivePolicies(policies);
      
      if (dynamicCategory === 'personal') {
        const infoReqTemplate = uniqueTemplates.find(t => t.name === 'info_req');
        if (infoReqTemplate) {
          setTemplateId(infoReqTemplate.id);
        }
      }
      
      setLoading(false)
    }

    loadData()
  }, [leadId, isOpen])

  /* ================= TEMPLATE SIDE EFFECTS ================= */
  useEffect(() => {
    if (composeMode === 'manual') {
      setHasTemplateFormLink(false)
      return
    }

    const template = templates.find(t => t.id === templateId)
    if (template && template.body) {
      const hasLink = template.body.includes('{{form_link}}')
      setHasTemplateFormLink(hasLink)

      // Auto-attach behavior (Requirement: Only for Info Request and Send Quote)
      const isRequiredTemplate = ['info_req', 'new_lead'].includes(template.name);
      setIsFormAttached(isRequiredTemplate);
    } else {
      setHasTemplateFormLink(false);
      setIsFormAttached(false);
    }
  }, [templateId, templates, composeMode])

  /* ================= ENSURE INTAKE FORM ================= */
  const ensureIntakeForm = async (currentFormType: string) => {
    if (!leadId || !currentFormType) return null

    const { data: existing } = await supabase
      .from('temp_intake_forms')
      .select('id')
      .eq('lead_id', leadId)
      .eq('form_type', currentFormType)
      .maybeSingle()

    if (existing?.id) {
      await supabase
        .from('temp_intake_forms')
        .update({ active_policies: activePolicies })
        .eq('id', existing.id)
      return existing.id
    }

    const { data, error } = await supabase
      .from('temp_intake_forms')
      .insert({
        lead_id: leadId,
        form_type: currentFormType,
        status: 'sent',
        active_policies: activePolicies
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return null
    }

    return data.id
  }

  /* ================= ORCHESTRATE INTAKE FORM ================= */
  useEffect(() => {
    if (isFormAttached && formType && leadId) {
      ensureIntakeForm(formType).then(id => {
        if (id) {
          setIntakeId(id)
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
          setFormLink(`${baseUrl}/intake/${id}`)
        }
      })
    } else {
      setIntakeId(null)
      setFormLink('')
    }
  }, [isFormAttached, formType, leadId])

  /* ================= PREVIEW ================= */
  const handlePreview = async () => {
    if (!formType) {
      setError('Select form type first')
      return
    }

    const id = await ensureIntakeForm(formType)
    if (!id) return

    window.open(`/intake/${id}?preview=true`, '_blank')
  }

  /* ================= SEND EMAIL ================= */
  const handleSend = async () => {
    // PREVENT SEND BEFORE FORM LINK IS READY
    if (isFormAttached && !formLink) {
      toast('Form is still generating. Please wait.', 'error');
      return;
    }

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

    // Ensure we have intake form generated if attached
    const finalIntakeId = isFormAttached && formType ? await ensureIntakeForm(formType) : null;

    if (isFormAttached && !finalIntakeId) {
      setSending(false)
      setError('Failed to generate Intake Form link. Please try again.')
      return
    }

    // 3. Format Body (Requirement 6)
    const processedBody = composeMode === 'manual'
      ? customBody
      : generatedBody;

    const baseFinal = processedBody + (isFormAttached && !hasTemplateFormLink
      ? `<br><br><b>Complete your form here:</b><br><a href="${formLink}" style="color: #10B889; font-weight: bold; text-decoration: underline;">${formLink}</a>`
      : '');

    // Production Final Combination: Only add HR if notes exist (Template mode)
    const finalBody = (composeMode === 'template' && notes.trim())
      ? `${baseFinal}<br><br><hr><br>${notes.replace(/\n/g, '<br>')}`
      : baseFinal;

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        templateId: safeTemplateId, // Use Requirement 5 safe ID
        formType: finalIntakeId ? formType : undefined,
        intakeId: finalIntakeId,
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
    if (onSuccess) onSuccess()
    onClose()
  }

  if (!isOpen) return null;

  return (
    <div className="relative z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 pb-safe my-auto relative">
        {/* HEADER */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[#10B889] to-[#2E5C85] sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">
              {lead?.policy_flow === 'renewal' ? 'Send Renewal Email' : 'Send Initial Email'}
            </h2>
            <p className="text-sm text-white/80 font-medium">
              {lead?.policy_flow === 'renewal' ? 'Configure and send renewal quotes to the client.' : 'Configure and send the onboarding email to the client.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 shadow-sm"
            title="Close"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          {loading ? (
            <div className="py-12">
              <Loading message="Fetching lead details..." />
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8">
              {/* ERROR ALERT */}
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}

              {/* ACTION FORM */}
              <div className="space-y-6">
                {/* AUTO-DETECTED POLICIES (Personal Lines) */}
                {lead?.insurence_category === 'personal' && (
                  <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Policies Requested</span>
                      <span className="bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded-full font-bold">Auto-Detected</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activePolicies.map(p => (
                        <span key={p} className="bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm capitalize">
                          {p.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* MODE TOGGLE */}
                <div className="flex bg-gray-200 p-1 rounded-xl w-full sm:w-fit">
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
                {lead?.policy_flow !== 'renewal' && composeMode === 'template' && (
                  <button
                    onClick={handlePreview}
                    className="card-header-navy"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-sm leading-tight">Preview Form</p>
                        <p className="text-white text-xs font-medium mt-0.5">Open a CSR view of the intake form in a new tab</p>
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                )}

                <div className="space-y-6">
                  {composeMode === 'template' && lead?.insurence_category !== 'personal' && (
                    <div className={`grid grid-cols-1 ${lead?.policy_flow !== 'renewal' ? 'md:grid-cols-2' : ''} gap-6`}>
                      {/* TEMPLATE SELECT */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1 h-5">
                          <label className="text-[10px] font-bold text-black uppercase tracking-widest">
                            {lead?.policy_flow === 'renewal' ? 'Renewal Email' : `Email Purpose (${formatFormType(formType).toUpperCase()} INSURANCE)`}
                          </label>
                          {lead?.policy_flow !== 'renewal' && (
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-tighter shadow-sm ${getBadgeStyle(formType)}`}>
                              {formatFormType(formType).toUpperCase()}
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
                          {templates.length === 0 ? (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 animate-in fade-in zoom-in-95 duration-200">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              <p className="text-[10px] text-amber-800 font-semibold leading-tight">
                                No templates found for {formatFormType(formType)}. Try selecting a different form type or check template settings.
                              </p>
                            </div>
                          ) : (
                            <p className="mt-1.5 text-[10px] text-gray-500 font-medium ml-1 leading-snug">
                              Select the email purpose to load <strong className="text-gray-700">{formatFormType(formType)}</strong> templates.
                            </p>
                          )}
                          <div className="pointer-events-none absolute top-3.5 right-0 flex items-center px-4 text-black transition-transform duration-200 peer-focus:rotate-180">
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* FORM TYPE SELECT */}
                      {lead?.policy_flow !== 'renewal' && (
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
                              <option value="landlord_condo">Landlord Condo</option>
                              <option value="umbrella">Umbrella</option>
                              <option value="motorcycle">Motorcycle</option>
                            </select>

                            <div className="pointer-events-none absolute top-3.5 right-0 flex items-center px-4 text-black transition-transform duration-200 peer-focus:rotate-180">
                              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            </div>
                          </div>
                          <p className="mt-1.5 text-[10px] text-gray-500 font-medium ml-1 leading-snug">
                            Form Type selects the specific subtype templates.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* METADATA DISPLAY */}
                  {composeMode === 'template' && templateId && (
                    <div className="group relative overflow-hidden bg-white border border-gray-200/60 rounded-2xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] hover:border-gray-300 transition-all duration-300 animate-in fade-in zoom-in-95">
                      {/* Subtle gradient background decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#10B889]/10 to-[#2E5C85]/10 blur-2xl -z-0 rounded-full group-hover:scale-125 transition-transform duration-500"></div>

                      <div className="relative z-10 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B889]/10 to-[#2E5C85]/10 text-[#2E5C85] border border-white shadow-sm flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-black/5 group-hover:from-[#10B889]/20 group-hover:to-[#2E5C85]/20 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        </div>
                        <div className="flex-1 space-y-2.5">
                          <div>
                            <p className="text-[10px] font-black text-black-400 uppercase tracking-[0.2em] mb-1">Loaded Template</p>
                            <p className="text-base font-bold text-gray-900 leading-tight">
                              <span className="text-[#2E5C85]">{formatFormType(formType)}</span>
                              <span className="mx-2 text-gray-300 font-medium">→</span>
                              {templateLabels[templates.find(t => t.id === templateId)?.name || ''] || templates.find(t => t.id === templateId)?.name}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2.5 pt-1">
                            {templates.find(t => t.id === templateId) && (
                              <>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-600 shadow-sm transition-colors group-hover:bg-white group-hover:border-slate-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                  <span className="text-slate-400 font-medium">Type:</span> <span className="capitalize">{templates.find(t => t.id === templateId)?.policy_type || formType}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-600 shadow-sm transition-colors group-hover:bg-white group-hover:border-slate-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  <span className="text-slate-400 font-medium">Flow:</span> <span className="capitalize">{templates.find(t => t.id === templateId)?.policy_flow}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-600 shadow-sm transition-colors group-hover:bg-white group-hover:border-slate-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                  <span className="text-slate-400 font-medium">Category:</span> <span className="capitalize">{templates.find(t => t.id === templateId)?.insurance_category}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION DIVIDER */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                      {composeMode === 'manual' ? 'Manual Composition' : 'Email Configuration'}
                    </span>
                    <div className="flex-1 h-px bg-slate-300" />
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
                    setFormType={setFormType}
                    leadData={lead}
                    composeMode={composeMode}
                    customBody={customBody}
                    setCustomBody={setCustomBody}

                    isFormAttached={isFormAttached}
                    setIsFormAttached={(val) => {
                      setIsFormAttached(val);
                      if (!val) {
                        setFormLink('');
                        setIntakeId(null);
                      }
                    }}
                    formLink={formLink}
                    hasTemplateFormLink={hasTemplateFormLink}
                    csrData={csrData}
                    isPersonalLines={lead?.insurence_category === 'personal'}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 border-t bg-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 transition-colors border border-rose-600 rounded-xl bg-rose-600 text-white hover:bg-rose-700 hover:border-rose-700 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || (isFormAttached && !formLink) || loading}
            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
    </div>
    </div>
  )
}
