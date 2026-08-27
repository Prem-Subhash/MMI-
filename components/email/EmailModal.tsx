'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/lib/toast'
import { ArrowLeft } from 'lucide-react'
import EmailGenerator from '@/components/email/EmailGenerator'
import Loading from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'

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

  // Attachment state
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
          current_stage_id,
          lead_group_id
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
      if (leadData.lead_group_id) {
        const { data: siblingData } = await supabase
          .from('temp_leads_basics')
          .select('policy_type')
          .eq('lead_group_id', leadData.lead_group_id)
        if (siblingData && siblingData.length > 0) {
          policies = siblingData.map((p: any) => p.policy_type);
        }
      } else if (leadData.lead_policies && leadData.lead_policies.length > 0) {
        policies = leadData.lead_policies.map((p: any) => p.policy_type);
      }
      setActivePolicies(policies);

      const combinedLead = {
        ...leadData,
        lead_policies: policies.map(p => ({ policy_type: p }))
      };
      setLead(combinedLead);
      
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

  /* ================= ATTACHMENTS HANDLING ================= */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const newAttachments = [...attachments];
    let hasError = false;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast(`File "${file.name}" exceeds 10MB limit.`, 'error');
        hasError = true;
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast(`Invalid file type for "${file.name}". Allowed: PDF, JPG, PNG, DOC, DOCX`, 'error');
        hasError = true;
        return;
      }
      newAttachments.push(file);
    });

    if (!hasError && files.length > 0) {
      toast(`Added ${files.length} attachment(s)`, 'success');
    }
    setAttachments(newAttachments);
    if (e.target) e.target.value = '';
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

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

    const bodyHasLink = Boolean(
      processedBody.includes('{{form_link}}') ||
      processedBody.includes('Complete your form here:') ||
      processedBody.includes('Click Here to Fill Form') ||
      (formLink && processedBody.includes(formLink))
    );

    const baseFinal = processedBody + (isFormAttached && !hasTemplateFormLink && !bodyHasLink && formLink
      ? `<br><br><b>Complete your form here:</b><br><a href="${formLink}" style="color: #10B889; font-weight: bold; text-decoration: underline;">Click Here to Fill Form</a>`
      : '');

    // Production Final Combination: Only add HR if notes exist (Template mode)
    const finalBody = (composeMode === 'template' && notes.trim())
      ? `${baseFinal}<br><br><hr><br>${notes.replace(/\n/g, '<br>')}`
      : baseFinal;

    // Enterprise Transport: Send raw binary files via FormData to prevent browser base64 memory overhead
    const formData = new FormData();
    formData.append('leadId', leadId);
    formData.append('templateId', safeTemplateId);
    if (finalIntakeId && formType) formData.append('formType', formType);
    if (finalIntakeId) formData.append('intakeId', finalIntakeId);
    if (customSubject) formData.append('customSubject', customSubject);
    if (finalBody) formData.append('customBody', finalBody);
    attachments.forEach(file => {
      formData.append('attachments', file);
    });

    const res = await fetch('/api/send-email', {
      method: 'POST',
      body: formData,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all border border-white/20"
            title="Back to lead details"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <span>{lead?.policy_flow === 'renewal' ? 'Send Renewal Email' : 'Send Initial Email'}</span>
        </div>
      }
      subtitle={lead?.policy_flow === 'renewal' ? 'Configure and send renewal quotes to the client.' : 'Configure and send the onboarding email to the client.'}
      maxWidth="max-w-4xl"
    >
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

                  {/* ATTACHMENTS SECTION */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B889]">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                          </svg>
                          Email Attachments
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Attach optional files (PDF, Word, Images) directly to this outgoing email (Max 10MB total)</p>
                      </div>
                      <div>
                        <input
                          type="file"
                          multiple
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-300 shadow-sm shrink-0"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Add Attachment
                        </button>
                      </div>
                    </div>

                    {attachments.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 animate-in fade-in duration-200">
                        {attachments.map((file, idx) => (
                          <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>{file.name}</p>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0 ml-2"
                              title="Remove attachment"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 h-[46px]"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={sending || (isFormAttached && !formLink) || loading}
          className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-60 disabled:shadow-none h-[46px] shadow-emerald-200 hover:shadow-emerald-300"
        >
          {sending ? 'Sending...' : 'Send Email'}
        </button>
      </div>
    </Modal>
  )
}
