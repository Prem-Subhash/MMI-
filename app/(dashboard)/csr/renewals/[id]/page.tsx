'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Send, Briefcase, Shield, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import Loading, { Spinner } from '@/components/ui/Loading'
import UpdateStageModal from '@/components/pipeline/UpdateStageModal'
import EmailGenerator from '@/components/email/EmailGenerator'
import { toast } from '@/lib/toast'
import { formatCurrency } from '@/lib/currency'

type Stage = {
  id: string
  stage_name: string
  stage_order: number
  mandatory_fields: string[] | null
}

type Renewal = {
  id: string
  client_name: string
  email?: string
  phone?: string
  policy_type: string
  renewal_date: string
  carrier?: string
  policy_number?: string
  current_premium?: number
  renewal_premium?: number
  pipeline_id: string
  current_stage_id: string
  stage_metadata: Record<string, any>
  pipeline_stage: Stage
}

export default function RenewalDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewFocus = searchParams?.get('view')
  const actionSectionRef = useRef<HTMLDivElement>(null)

/* ── display helpers ─────────────────────────────────────── */

function formatPolicyType(raw?: string | null) {
  if (!raw) return '—'
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function StageBadge({ stage }: { stage?: string | null }) {
  if (!stage) return <span className="text-gray-400 text-sm">—</span>
  const map: Record<string, string> = {
    'New Lead':               'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Quoting in Progress':    'bg-yellow-50  text-yellow-700  border border-yellow-200',
    'Quote Has Been Emailed': 'bg-blue-50    text-blue-700    border border-blue-200',
    'Consent Letter Sent':    'bg-purple-50  text-purple-700  border border-purple-200',
    'Completed':              'bg-blue-100   text-blue-800    border border-blue-300',
    'Did Not Bind':           'bg-red-50     text-red-700     border border-red-200',
  }
  const cls = map[stage] ?? 'bg-gray-100 text-gray-600 border border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
      {stage}
    </span>
  )
}

function KpiCard({ 
  icon, 
  label, 
  children,
  accent = 'from-gray-200 to-gray-300',
  glow = 'shadow-gray-200/50',
  iconBg = 'bg-gray-50 text-gray-400',
  hoverIconBg = 'group-hover:bg-gray-100 group-hover:text-gray-600'
}: { 
  icon: React.ReactNode; 
  label: string; 
  children: React.ReactNode;
  accent?: string;
  glow?: string;
  iconBg?: string;
  hoverIconBg?: string;
}) {
  return (
    <div className={`
      relative bg-white rounded-2xl border border-gray-100 p-5
      shadow-sm hover:shadow-lg active:shadow-lg ${glow}
      hover:-translate-y-1 active:-translate-y-1
      hover:border-transparent active:border-transparent
      transition-all duration-300 overflow-hidden h-full flex flex-col gap-1.5 group/card
    `}>
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent}
          transform scale-x-0 group-hover/card:scale-x-100 group-active/card:scale-x-100
          transition-transform duration-300 origin-left rounded-t-2xl`}
      />

      <div className="flex items-center gap-2">
        <div className={`
            p-2 rounded-lg ${iconBg} ${hoverIconBg}
            transition-all duration-300 inline-flex
            group-hover/card:scale-110 group-active/card:scale-110
        `}>
          {icon}
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider leading-none text-gray-400 group-hover/card:text-gray-600 transition-colors">
          {label}
        </p>
      </div>
      <div className="pl-0.5 pt-1">{children}</div>
    </div>
  )
}

const IUser = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IMail = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IFile = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IZap = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>

  const [lead, setLead] = useState<Renewal | null>(null)

  const [loading, setLoading] = useState(true)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [isEditingPremium, setIsEditingPremium] = useState(false)
  const [tempPremium, setTempPremium] = useState('')
  const [savingPremium, setSavingPremium] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  /* ================= AUTO FOCUS ================= */
  useEffect(() => {
    if (viewFocus === 'focused' && !loading && actionSectionRef.current) {
      setIsFocused(true)
      setTimeout(() => {
        actionSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
      
      const timer = setTimeout(() => setIsFocused(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [loading, viewFocus])

  /* ================= EMAIL MODAL STATE ================= */
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [templateId, setTemplateId] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [generatedBody, setGeneratedBody] = useState('')
  const [notes, setNotes] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('temp_leads_basics')
      .select(`
        id,
        client_name,
        email,
        phone,
        policy_type,
        renewal_date,
        carrier,
        policy_number,
        current_premium,
        renewal_premium,
        pipeline_id,
        current_stage_id,
        stage_metadata,
        pipeline_stages (
          id,
          stage_name,
          stage_order,
          mandatory_fields
        )
      `)
      .eq('id', id)
      .eq('assigned_csr', user.id)
      .single()

    if (error || !data) {
      console.error(error)
      setLoading(false)
      return
    }

    const stage = Array.isArray(data.pipeline_stages)
      ? data.pipeline_stages[0]
      : data.pipeline_stages

    setLead({
      ...data,
      pipeline_stage: stage,
    })
    setTempPremium(data.renewal_premium?.toString() || '')

    setLoading(false)
  }

  const savePremium = async () => {
    if (!lead) return
    setSavingPremium(true)
    const val = tempPremium === '' ? null : Number(tempPremium)
    
    const { error } = await supabase
      .from('temp_leads_basics')
      .update({ renewal_premium: val })
      .eq('id', lead.id)

    if (error) {
      alert('Failed to save premium: ' + error.message)
    } else {
      setLead({ ...lead, renewal_premium: val ?? undefined })
      setIsEditingPremium(false)
    }
    setSavingPremium(false)
  }

  useEffect(() => {
    load()
  }, [id])

  /* ================= EMAIL OPERATIONS ================= */
  useEffect(() => {
    if (!showEmailModal) return;
    const fetchTemplates = async () => {
      const { data } = await supabase.from('email_templates').select('*').eq('is_active', true)
      setTemplates(data || [])
    }
    fetchTemplates()
  }, [showEmailModal, lead])

  const handleSendEmail = async () => {
    if (!templateId) return toast('Select an email template', 'warning')
    if (!lead?.email) return toast('Client email is missing', 'error')

    setSendingEmail(true)
    
    const finalBody = notes.trim()
      ? `${generatedBody}<br><br><hr><br><br>${notes.replace(/\n/g, '<br>')}`
      : generatedBody;

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        templateId,
        formType: 'renewal',
        customSubject,
        customBody: finalBody,
      }),
    });

    const result = await res.json()
    setSendingEmail(false)

    if (!res.ok || !result.success) {
      toast(result?.error || result?.message || 'Email failed to send.', 'error')
      return
    }

    toast('Email sent successfully', 'success')
    setShowEmailModal(false)
    load() // reload to get updated stage_metadata if needed
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loading message="Syncing renewal data..." />
    </div>
  )

  if (!lead) return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-700">Renewal Not Found</h2>
      <p className="text-gray-500 mt-2">This renewal does not exist or you do not have permission to view it.</p>
      <Link href="/csr/renewals" className="mt-4 inline-block text-emerald-600 hover:underline">Back to Dashboard</Link>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-400 font-mono">ID: {lead.id.slice(0, 8)}</div>
      </div>

      <div className="flex flex-col gap-6">
        {/* TOP CARD: Client Info (Styled like Lead Details) */}
        <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-8 py-6">
            <h1 className="text-2xl font-bold text-white">{lead.client_name}</h1>
            <p className="text-white/80 text-sm mt-1">
              {formatPolicyType(lead.policy_type)} Renewal
            </p>
          </div>

          {/* CONTENT */}
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard 
                icon={<IUser />} 
                label="Client Name"
                accent="from-[#10B889] to-[#0d9470]"
                glow="shadow-emerald-200/60"
                iconBg="bg-emerald-50 text-emerald-600"
                hoverIconBg="group-hover/card:bg-[#10B889] group-hover/card:text-white"
              >
                <p className="text-base font-bold text-gray-800 truncate">{lead.client_name || '—'}</p>
              </KpiCard>
              <KpiCard 
                icon={<IMail />} 
                label="Email Address"
                accent="from-[#2E5C85] to-[#1e3f5e]"
                glow="shadow-blue-200/60"
                iconBg="bg-blue-50 text-blue-600"
                hoverIconBg="group-hover/card:bg-[#2E5C85] group-hover/card:text-white"
              >
                <p className="text-base font-bold text-gray-800 truncate" title={lead.email}>{lead.email || '—'}</p>
              </KpiCard>
              <KpiCard 
                icon={<IFile />} 
                label="Policy Type"
                accent="from-amber-500 to-orange-500"
                glow="shadow-amber-200/60"
                iconBg="bg-amber-50 text-amber-600"
                hoverIconBg="group-hover/card:bg-amber-500 group-hover/card:text-white"
              >
                <p className="text-base font-bold text-gray-800">{formatPolicyType(lead.policy_type)}</p>
              </KpiCard>
              <KpiCard 
                icon={<IZap />} 
                label="Current Status"
                accent="from-purple-600 to-indigo-600"
                glow="shadow-purple-200/60"
                iconBg="bg-purple-50 text-purple-600"
                hoverIconBg="group-hover/card:bg-purple-600 group-hover/card:text-white"
              >
                <StageBadge stage={lead.pipeline_stage?.stage_name} />
              </KpiCard>
            </div>

            {/* Renewal Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <KpiCard 
                icon={<Briefcase size={14} />} 
                label="Carrier"
                accent="from-[#10B889] to-[#0d9470]"
                glow="shadow-emerald-200/60"
                iconBg="bg-emerald-50 text-emerald-600"
                hoverIconBg="group-hover/card:bg-[#10B889] group-hover/card:text-white"
              >
                <p className="text-sm font-bold text-gray-700">{lead.carrier || '—'}</p>
              </KpiCard>
              <KpiCard 
                icon={<Shield size={14} />} 
                label="Policy Number"
                accent="from-[#2E5C85] to-[#1e3f5e]"
                glow="shadow-blue-200/60"
                iconBg="bg-blue-50 text-blue-600"
                hoverIconBg="group-hover/card:bg-[#2E5C85] group-hover/card:text-white"
              >
                <p className="text-sm font-bold text-gray-700 font-mono">{lead.policy_number || '—'}</p>
              </KpiCard>
              <KpiCard 
                icon={<Calendar size={14} />} 
                label="Renewal Date"
                accent="from-amber-500 to-orange-500"
                glow="shadow-amber-200/60"
                iconBg="bg-amber-50 text-amber-600"
                hoverIconBg="group-hover/card:bg-amber-500 group-hover/card:text-white"
              >
                <p className="text-sm font-bold text-gray-700">{new Date(lead.renewal_date).toLocaleDateString()}</p>
              </KpiCard>
              <KpiCard 
                icon={<DollarSign size={14} />} 
                label="Premium"
                accent="from-purple-600 to-indigo-600"
                glow="shadow-purple-200/60"
                iconBg="bg-purple-50 text-purple-600"
                hoverIconBg="group-hover/card:bg-purple-600 group-hover/card:text-white"
              >
                <p className="text-sm font-bold text-gray-700">
                  {lead.current_premium ? formatCurrency(lead.current_premium) : '—'}
                </p>
              </KpiCard>
            </div>

            <div className={`mb-8 p-6 rounded-2xl border ${!lead.renewal_premium ? 'bg-cyan-50 border-cyan-100' : 'bg-gray-50 border-gray-100'}`}>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                Renewal Premium Setup
                {!lead.renewal_premium && <span className="text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded-full">Required</span>}
              </h3>
              
              <div className="max-w-xs">
                {isEditingPremium ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input
                        type="number"
                        autoFocus
                        value={tempPremium}
                        onChange={(e) => setTempPremium(e.target.value)}
                        className="w-full pl-7 pr-4 py-2 bg-white border-2 border-emerald-500 rounded-lg outline-none transition-all font-bold"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      onClick={savePremium}
                      disabled={savingPremium}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 min-w-[70px] flex items-center justify-center"
                    >
                      {savingPremium ? <Spinner size={16} /> : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPremium(false)
                        setTempPremium(lead.renewal_premium?.toString() || '')
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingPremium(true)}
                    className="group flex flex-col items-start"
                  >
                    <span className={`text-3xl font-black ${lead.renewal_premium ? 'text-gray-900' : 'text-cyan-600 underline decoration-dotted'}`}>
                      {lead.renewal_premium ? formatCurrency(lead.renewal_premium) : 'Enter Renewal Premium'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 group-hover:text-emerald-600 transition-colors uppercase tracking-widest">
                      {lead.renewal_premium ? 'Click to change amount' : 'Manually entered required'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* ACTION BAR */}
            <div 
              ref={actionSectionRef}
              className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-t pt-8 transition-all duration-700 ${isFocused ? 'bg-blue-50/50 p-6 rounded-2xl border-2 border-blue-400 ring-4 ring-blue-400/20 shadow-xl scale-[1.02] z-10 mx-[-8px]' : ''}`}
            >
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => router.back()}
                  className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 font-semibold active:scale-95"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl shadow-lg transition-all font-bold flex items-center justify-center gap-2 active:scale-95 ${isFocused ? 'bg-blue-600 text-white hover:bg-blue-700 ring-4 ring-blue-600/30' : 'bg-[#10B889] hover:bg-[#0e9e75] text-white'}`}
                >
                  <Send size={18} />
                  Send Email
                </button>
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#2E5C85] hover:bg-[#234b6e] text-white rounded-xl shadow-lg transition-all font-bold active:scale-95 whitespace-nowrap"
                >
                  Update Status
                </button>
              </div>

              <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto bg-blue-50/50 lg:bg-transparent p-3 lg:p-0 rounded-xl border border-blue-100 lg:border-none">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-3">Current Status</span>
                <StageBadge stage={lead.pipeline_stage.stage_name} />
              </div>
            </div>
          </div>
        </div>


      </div>

      {showUpdateModal && lead && (
        <UpdateStageModal
          leadId={lead.id}
          pipelineId={lead.pipeline_id}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => {
            load() // Reload data to show new stage
          }}
        />
      )}

      {/* EMAIL MODAL OVERLAY */}
      {showEmailModal && lead && (
        <div className="relative z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl opacity-100 max-h-[90dvh] overflow-hidden flex flex-col pointer-events-auto my-auto relative">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[#10B889] to-[#2E5C85] sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-white">Send Renewal Email</h2>
                <p className="text-sm text-white/80 mt-1">Configure and send an email to {lead.client_name}</p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto flex-1">
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
                formType={lead.policy_type === 'auto' ? 'auto' : 'home'}
                leadData={lead}
              />
              
              <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="w-full sm:w-1/3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-4 rounded-xl shadow-sm transition-all flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="w-full sm:w-2/3 bg-gradient-to-r from-[#2E5C85] to-[#10B889] hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {sendingEmail ? <Spinner size={20} /> : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>
      )}
      </div>
    </div>
  )
}
