'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
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
      .eq('assigned_csr', user.id) // Security check
      .single()

    if (error || !data) {
      console.error(error)
      setLoading(false)
      return
    }

    // Supabase returns array or single object depending on relationship, normalize it
    const stage = Array.isArray(data.pipeline_stages)
      ? data.pipeline_stages[0]
      : data.pipeline_stages

    setLead({
      ...data,
      pipeline_stage: stage,
    })

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])



  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  )

  if (!lead) return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-700">Renewal Not Found</h2>
      <p className="text-gray-500 mt-2">This renewal does not exist or you do not have permission to view it.</p>
      <Link href="/dashboard/renewals" className="mt-4 inline-block text-emerald-600 hover:underline">Back to Dashboard</Link>
    </div>
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <p className="text-sm text-gray-500">Current Premium</p>
                <p className="font-semibold text-gray-800">
                  {lead.current_premium ? `$${lead.current_premium.toLocaleString()}` : '—'}
                </p>
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
  )
}
