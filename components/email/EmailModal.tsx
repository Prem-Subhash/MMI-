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

// Unused template maps removed

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
          created_at,
          status,
          pipeline_id,
          current_stage_id
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

      if (templateError) {
        setError(templateError.message)
        setLoading(false)
        return
      }

      if (leadData.pipeline_id) {
        const { data: pipelineData } = await supabase
          .from('pipelines')
          .select('name')
          .eq('id', leadData.pipeline_id)
          .single();
        if (pipelineData) (leadData as any).pipeline_name = pipelineData.name;
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

      // Filter out only umbrella templates to maintain parity, but do NOT deduplicate by name
      const allTemplates = (templateData || []).filter(t => !t.name.toLowerCase().includes('umbrella'))
      setTemplates(allTemplates)
      
      let policies = [leadData.policy_type || 'home'];
      if (leadData.lead_policies && leadData.lead_policies.length > 0) {
        policies = leadData.lead_policies.map((p: any) => p.policy_type);
      }
      setActivePolicies(policies);
      
      // Auto-assign info_req template
      const infoReqTpl = allTemplates.find(t => t.name === 'info_req');
      if (infoReqTpl) {
        setTemplateId(infoReqTpl.id);
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
                  {/* REMOVED PRIMARY DROPDOWNS: Selection is now handled dynamically per-row inside EmailGenerator */}

                  {/* REMOVED METADATA DISPLAY: Covered by per-row display in Generator */}

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
