'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Loading, { Spinner } from '@/components/ui/Loading'
import UpdateStageModal from '@/components/pipeline/UpdateStageModal'

type Stage = {
  id: string
  stage_name: string
  stage_order: number
  mandatory_fields: string[] | null
}

type Renewal = {
  id: string
  client_name: string
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
  const [lead, setLead] = useState<Renewal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [isEditingPremium, setIsEditingPremium] = useState(false)
  const [tempPremium, setTempPremium] = useState('')
  const [savingPremium, setSavingPremium] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('temp_leads_basics')
      .select(`
        id,
        client_name,
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
              {lead.policy_type} Renewal
            </p>
          </div>

          {/* CONTENT */}
          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-500">Carrier</p>
                <p className="font-semibold text-gray-800">{lead.carrier || '—'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-500">Policy Number</p>
                <p className="font-semibold text-gray-800">{lead.policy_number || '—'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-500">Renewal Date</p>
                <p className="font-semibold text-gray-800">{new Date(lead.renewal_date).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm text-gray-500">Premium</p>
                <p className="font-semibold text-gray-800">
                  {lead.current_premium ? `$${lead.current_premium.toLocaleString()}` : '—'}
                </p>
              </div>
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
                      {lead.renewal_premium ? `$${lead.renewal_premium.toLocaleString()}` : 'Enter Renewal Premium'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 mt-1 group-hover:text-emerald-600 transition-colors uppercase tracking-widest">
                      {lead.renewal_premium ? 'Click to change amount' : 'Manually entered required'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* ACTION BAR */}
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
                  onClick={() => setShowUpdateModal(true)}
                  className="px-6 py-2.5 bg-[#2E5C85] hover:bg-[#234b6e] text-white rounded-lg shadow transition font-medium"
                >
                  Update Status
                </button>
              </div>

              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">Current Status:</span>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                  {lead.pipeline_stage.stage_name}
                </span>
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
      </div>
    </div>
  )
}
