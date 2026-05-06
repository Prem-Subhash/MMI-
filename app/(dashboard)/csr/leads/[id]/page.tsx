'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import UpdateStageModal from '@/components/pipeline/UpdateStageModal'
import EditClientModal from '@/components/leads/EditClientModal'
import DocumentViewer from '@/components/leads/DocumentViewer'
import EmailModal from '@/components/email/EmailModal'
import { FIELD_LABELS } from '@/lib/fieldLabels'
import { toast } from '@/lib/toast'
import Loading, { Spinner } from '@/components/ui/Loading'
import { Edit2 } from 'lucide-react'

export default function LeadReviewPage() {
  /* ================= ROUTER PARAMS ================= */
  const params = useParams<{ id: string }>()
  const leadId = params?.id
  const router = useRouter()

  const searchParams = useSearchParams()
  const viewFocus = searchParams?.get('view')
  const emailSectionRef = useRef<HTMLDivElement>(null)

  const [lead, setLead] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const [isFocused, setIsFocused] = useState(false)

  /* ================= AUTO FOCUS ================= */
  useEffect(() => {
    if (viewFocus === 'focused' && !loading && emailSectionRef.current) {
      setIsFocused(true)
      setTimeout(() => {
        emailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
      
      // Remove highlight after 5 seconds
      const timer = setTimeout(() => setIsFocused(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [loading, viewFocus])


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
        toast('Lead not found', 'error')
        setLoading(false)
        return
      }

      const { data: formData } = await supabase
        .from('temp_intake_forms')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (formData) {
        const { data: docs } = await supabase
          .from('uploaded_documents')
          .select('*')
          .eq('intake_form_id', formData.id)
        setDocuments(docs || [])
      }

      setLead(leadData)
      setForm(formData || null)
      setLoading(false)
    }

    loadData()
  }, [leadId])

  /* ================= FETCH HISTORY ================= */
  const openHistoryModal = async () => {
    setHistoryLoading(true)
    setShowHistory(true)
    const { data, error } = await supabase
      .from('lead_stage_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true }) // Chronological order

    if (!error && data) {
      // Duplicate history cleanup: remove consecutive identical stages
      const deduplicated = data.filter((item, index, arr) => {
        if (index === 0) return true;
        return item.stage_name !== arr[index - 1].stage_name || 
               JSON.stringify(item.stage_metadata) !== JSON.stringify(arr[index - 1].stage_metadata);
      });
      setHistory(deduplicated)
    }
    setHistoryLoading(false)
  }


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading message="Loading lead details..." />
      </div>
    )
  }

  if (error) {
    return <div className="p-10 text-red-600 font-medium">{error}</div>
  }

  const status = lead?.status || 'NOT_SENT';

  /* ================= UNIFIED UI ================= */
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{lead.client_name || 'Lead Details'}</h1>
              <p className="text-white/80 text-sm mt-1">
                Review lead information and pipeline status
              </p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center justify-center gap-2 bg-brand-dark hover:bg-brand-dark/90 text-white px-4 py-2 rounded-lg border border-white/20 transition-all text-sm font-bold backdrop-blur-sm shadow-sm"
            >
              <Edit2 size={14} />
              Edit Client Info
            </button>
          </div>

          {/* CONTENT */}
          <div className="p-8">
            {/* 1. INFO GRID LAYOUT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    status === 'ACCEPTED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,184,137,0.4)]' :
                    status === 'SUBMITTED' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' :
                    status === 'WAITING_FOR_SUBMISSION' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]' :
                    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  }`} />
                  <p className="text-[18px] font-black text-gray-900 truncate leading-tight">
                    {lead.pipeline_stages?.stage_name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. BUTTON GROUP ORGANIZATION */}
            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
              {/* Primary actions (left group) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg shadow-sm transition flex items-center justify-center gap-2 font-bold min-w-[120px]"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  onClick={openHistoryModal}
                  className="px-5 py-2.5 bg-brand-dark text-white hover:bg-brand-dark/90 rounded-lg shadow-sm transition flex items-center justify-center gap-2 font-bold min-w-[140px]"
                >
                  View History
                </button>
                <button
                  onClick={() => {
                    if (!lead.pipeline_id) {
                      toast('Pipeline not assigned to this lead', 'warning')
                      return
                    }
                    setShowUpdateModal(true)
                  }}
                  className="px-5 py-2.5 bg-[#2E5C85] hover:bg-[#234b6e] text-white rounded-lg shadow-sm transition flex items-center justify-center gap-2 font-bold min-w-[150px]"
                >
                  Update Status
                </button>
              </div>

              {/* Secondary actions (right group) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {lead.insurence_category && lead.insurence_category.toLowerCase() === 'personal' && (
                  <Link
                    href={`/csr/leads?stage=${encodeURIComponent(lead.current_stage || lead.pipeline_stages?.stage_name || 'New Lead')}`}
                    className="px-5 py-2.5 bg-rose-500 text-white hover:bg-rose-600 hover:text-white border border-gray-200 rounded-lg shadow-sm transition flex items-center justify-center gap-2 font-bold whitespace-nowrap"
                  >
                    <ExternalLink size={16} /> 
                    View in Pipeline
                  </Link>
                )}
                <button
                  onClick={() => setShowEmailModal(true)}
                  className={`px-6 py-2.5 font-bold tracking-wider rounded-lg shadow-md transition flex items-center justify-center gap-2 ${isFocused ? 'bg-blue-600 text-white hover:bg-blue-700 ring-4 ring-blue-600/30 animate-bounce' : 'bg-[#10B889] hover:opacity-90 text-white'}`}
                >
                  <Send size={16} />
                  Send Email
                </button>
              </div>
            </div>

            {/* 3. SUCCESS MESSAGE (PHASE STATUS) */}
            <div className="mt-6">
              {(() => {
                if (status === 'ACCEPTED') {
                  return (
                    <div className="flex items-center gap-3 px-5 py-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-sm font-bold w-full">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Lead accepted and moved to pipeline
                    </div>
                  );
                } else if (status === 'SUBMITTED') {
                  return (
                    <div className="flex items-center gap-3 px-5 py-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm font-bold w-full">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Client has submitted the intake form
                    </div>
                  );
                } else if (status === 'WAITING_FOR_SUBMISSION') {
                  return (
                    <div className="flex items-center gap-3 px-5 py-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100 text-sm font-bold w-full">
                      <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse flex-shrink-0" />
                      Waiting for client to submit intake form
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 text-sm font-bold w-full">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Intake form not sent to client
                    </div>
                  );
                }
              })()}
            </div>

            {/* 4. "VIEW FORM" BOTTOM ACTIONS */}
            {(status === 'SUBMITTED' || status === 'ACCEPTED') && form && (
              <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-4">
                <button
                  onClick={() => setShowFormModal(true)}
                  className="w-full flex items-center justify-center gap-3 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 py-4 rounded-xl font-bold transition-all shadow-sm"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Form
                </button>
              </div>
            )}
          </div>
        </div>

        {/* UPDATE STAGE MODAL */}
        {showUpdateModal && (
          <UpdateStageModal
            leadId={lead.id}
            pipelineId={lead.pipeline_id}
            currentStageId={lead.current_stage_id}
            onClose={() => setShowUpdateModal(false)}
            onSuccess={() => router.refresh()}
          />
        )}

        {/* VIEW SUBMITTED FORM MODAL */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[#10B889] to-[#2E5C85] sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-white">Submitted Intake Form</h2>
                  <p className="text-sm text-white/80 font-medium">Submitted on {new Date(form.submitted_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 shadow-sm"
                  title="Close"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                 {/* STRUCTURED FORM DATA RENDERER */}
                 {form.form_data && Object.entries(form.form_data).map(([sectionKey, sectionData]) => {
                    const formatLabel = (key: string) => FIELD_LABELS[key] || key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
 
                    // Skip empty sections completely
                    if (!sectionData || (typeof sectionData === 'object' && Object.keys(sectionData).length === 0)) return null;
                    if (Array.isArray(sectionData) && sectionData.length === 0) return null;
 
                    return (
                      <div key={sectionKey} className="mb-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-emerald-50/50 px-5 py-3 border-b border-emerald-100 flex items-center justify-between">
                          <h3 className="font-bold text-emerald-700">{formatLabel(sectionKey)}</h3>
                        </div>
                        <div className="p-5">
                          {Array.isArray(sectionData) ? (
                            <div className="space-y-4">
                              {sectionData.map((item, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                                     {Object.entries(item).map(([k, v]) => (
                                       <div key={k}>
                                         <span className="text-slate-500 block text-xs font-medium mb-1 uppercase tracking-wider">{formatLabel(k)}</span>
                                         <span className="font-medium text-slate-800">{v === null || v === undefined || v === '' ? '-' : String(v)}</span>
                                       </div>
                                     ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 text-sm">
                              {Object.entries(sectionData as object).map(([k, v]) => (
                                <div key={k}>
                                  <span className="text-slate-500 block text-xs font-medium mb-1 uppercase tracking-wider">{formatLabel(k)}</span>
                                  <span className="font-medium text-slate-800">{v === null || v === undefined || v === '' ? '-' : String(v)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                 })}
 
                 {/* UPLOADED DOCUMENTS RENDERER */}
                 <DocumentViewer documents={documents} />
              </div>
            </div>
          </div>
        )}
        {/* VIEW HISTORY MODAL */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[#10B889] to-[#2E5C85] sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-white">Stage History</h2>
                  <p className="text-sm text-white">Previous updates for this lead</p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 shadow-sm"
                  title="Close"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
                {historyLoading ? (
                  <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                    <Spinner size={32} />
                    <p className="font-medium">Loading history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-12 text-center text-emerald-500 bg-white rounded-xl border border-dashed border-slate-300">
                    No stage history found for this lead.
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-emerald-50/50 px-5 py-3 border-b border-emerald-100 flex items-center justify-between">
                        <h3 className="font-bold text-emerald-700">{item.stage_name}</h3>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      {item.stage_metadata && Object.keys(item.stage_metadata).length > 0 ? (
                        <div className="p-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            {Object.entries(item.stage_metadata).map(([k, v]) => {
                              // We format just like the actual intake form modal with FIELD_LABELS
                              const formatLabel = (key: string) => FIELD_LABELS[key] || key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                              return (
                                <div key={k}>
                                  <span className="text-slate-500 block text-xs font-medium mb-1 uppercase tracking-wider">{formatLabel(k)}</span>
                                  <span className="font-medium text-slate-800">{v === null || v === undefined || v === '' ? '-' : String(v)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-slate-400 italic text-center">
                          No additional metadata recorded for this stage
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* EDIT CLIENT MODAL */}
        {showEditModal && (
          <EditClientModal
            lead={lead}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              toast('Data updated. Refreshing...', 'info')
              router.refresh()
            }}
          />
        )}
        
        {/* EMAIL MODAL */}
        <EmailModal
          leadId={lead.id}
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
        />
      </div>
    </div>
  )
}
