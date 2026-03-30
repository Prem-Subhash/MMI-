'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import UpdateStageModal from '@/components/pipeline/UpdateStageModal'
import { FIELD_LABELS } from '@/lib/fieldLabels'

export default function LeadReviewPage() {
  /* ================= ROUTER PARAMS ================= */
  const params = useParams<{ id: string }>()
  const leadId = params?.id
  const router = useRouter()

  /* ================= STATE ================= */
  const [lead, setLead] = useState<any>(null)
  const [form, setForm] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

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
      .order('created_at', { ascending: false })

    if (!error && data) {
      setHistory(data)
    }
    setHistoryLoading(false)
  }

  /* ================= ACCEPT LEAD ================= */
  const handleAccept = async () => {
    if (!lead || !form) return

    setAccepting(true)
    setError(null)

    try {
      // Improved check for existing client by both phone and email
      const { data: phoneMatch } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', lead.phone)
        .maybeSingle()

      let emailMatch = null
      if (lead.email) {
        const { data } = await supabase
          .from('clients')
          .select('id')
          .eq('email', lead.email)
          .maybeSingle()
        emailMatch = data
      }

      let clientId = phoneMatch?.id || emailMatch?.id

      if (!clientId) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            client_name: lead.client_name, // Include client name if available
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

      // NEW LOGIC per specifications: Update temp_leads_basics
      const { error: leadUpdateError } = await supabase
        .from('temp_leads_basics')
        .update({
          status: 'accepted',
          current_stage: 'Quoting in Progress',
          accepted_at: new Date().toISOString()
        })
        .eq('id', lead.id)

      if (leadUpdateError) {
        console.error('Accept Lead failed:', leadUpdateError)
        return
      }

      router.refresh()
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

  const isEmailSent = !!lead?.intake_email_sent;
  const isSubmitted = !!lead?.form_submitted_at;
  const isAccepted = lead?.status === 'accepted';

  /* ================= UNIFIED UI ================= */
  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-800 truncate">{lead.email}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-500">Policy Type</p>
                <p className="font-semibold capitalize text-gray-800">
                  {lead.policy_type}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-500">Current Status</p>
                <span className="inline-flex mt-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  {lead.current_stage || lead.pipeline_stages?.stage_name || 'N/A'}
                </span>
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
                  onClick={openHistoryModal}
                  className="px-4 py-2.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-lg shadow-sm transition font-medium"
                >
                  View History
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

              {/* DYNAMIC STATUS BADGES */}
              {!isEmailSent && (
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-700 rounded-lg border text-sm font-semibold border-slate-200">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Intake form not sent to client
                </div>
              )}

              {isEmailSent && !isSubmitted && (
                <div className="flex items-center gap-3 px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg border-yellow-200 text-sm font-medium">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  Waiting for client to submit intake form
                </div>
              )}

              {isSubmitted && !isAccepted && (
                <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-sm font-semibold">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Client has submitted the intake form
                </div>
              )}

              {isAccepted && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg border text-sm font-semibold border-emerald-200">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Lead accepted and moved to pipeline
                </div>
              )}
            </div>

            {/* FORM OPERATIONS */}
            {isSubmitted && form && (
              <div className="space-y-4 border-t pt-6">
                <button
                  onClick={() => setShowFormModal(true)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 py-4 rounded-xl font-bold transition-colors shadow-sm"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Submitted Form
                </button>

                {!isAccepted && (
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold disabled:opacity-60 shadow-md transition-colors"
                  >
                    {accepting ? 'Accepting Lead...' : 'Accept Lead'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* UPDATE STAGE MODAL */}
        {showUpdateModal && (
          <UpdateStageModal
            leadId={lead.id}
            pipelineId={lead.pipeline_id}
            onClose={() => setShowUpdateModal(false)}
            onSuccess={() => router.refresh()}
          />
        )}

        {/* VIEW SUBMITTED FORM MODAL */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Submitted Intake Form</h2>
                  <p className="text-sm text-slate-500">Submitted on {new Date(form.submitted_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  title="Close"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                          <h3 className="font-semibold text-slate-800">{formatLabel(sectionKey)}</h3>
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
                 {documents && documents.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      Uploaded Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.map((doc: any) => {
                        const url = supabase.storage.from('documents').getPublicUrl(doc.file_path).data.publicUrl;
                        return (
                        <div key={doc.id} className="p-4 border border-slate-200 rounded-xl bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3 mb-4 relative group">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-semibold text-slate-800 truncate" title={doc.file_name}>{doc.file_name}</p>
                              <p className="text-xs text-slate-500 mt-1 font-medium">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                            </div>
                            
                            {/* Hover explicit filename reveal */}
                            <div className="absolute hidden group-hover:block z-10 bg-slate-800 text-white text-xs p-2.5 rounded-lg break-words max-w-[200px] top-full left-0 mt-2 shadow-xl whitespace-normal pointer-events-none">
                              {doc.file_name}
                            </div>
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-center text-blue-600 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-lg transition-colors w-full inline-block border border-blue-100">
                            View File
                          </a>
                        </div>
                      )})}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* VIEW HISTORY MODAL */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Stage History</h2>
                  <p className="text-sm text-slate-500">Previous updates for this lead</p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  title="Close"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
                {historyLoading ? (
                  <div className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Loading history...
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                    No stage history found for this lead.
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">{item.stage_name}</h3>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">
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
      </div>
    </div>
  )
}
