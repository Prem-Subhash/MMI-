'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Send } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

/* ================= TYPES ================= */

type Lead = {
  id: string
  client_name: string
  phone: string
  email: string
  insurence_category: string
  policy_flow: string
  created_at: string
  current_stage: {
    stage_name: string
  } | null
}

/* ================= FILTERS ================= */

const STAGE_FILTERS = [
  { label: 'All', value: null },
  { label: 'Quoting in Progress', value: 'Quoting in Progress' },
  { label: 'Quote has been Emailed', value: 'Quote Has Been Emailed' },
  { label: 'Consent Letter Sent', value: 'Consent Letter Sent' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Did not bind', value: 'Did Not Bind' },
]

/* ================= PAGE ================= */

export default function MyLeadsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const stageFilter = searchParams.get('stage')

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  /* ================= LOAD LEADS ================= */

  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      let query = supabase
        .from('temp_leads_basics')
        .select(`
          id,
          client_name,
          phone,
          email,
          insurence_category,
          policy_flow,
          created_at,
          current_stage:pipeline_stages!inner (
            stage_name
          )
        `)
        .eq('assigned_csr', user.id)
        .order('created_at', { ascending: false })

      /* ✅ FIXED FILTER */
      if (stageFilter) {
        query = query.eq('current_stage.stage_name', stageFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error(error)
        setLeads([])
      } else {
        /* ✅ NORMALIZE JOIN RESULT */
        const formatted = (data as any[]).map(row => ({
          ...row,
          current_stage: Array.isArray(row.current_stage)
            ? row.current_stage[0] ?? null
            : row.current_stage ?? null,
        }))

        setLeads(formatted)
      }

      setLoading(false)
    }

    loadLeads()
  }, [stageFilter])

  /* ================= FILTER HANDLER ================= */

  const applyFilter = (stage: string | null) => {
    if (!stage) {
      router.push('/dashboard/leads')
    } else {
      router.push(`/dashboard/leads?stage=${encodeURIComponent(stage)}`)
    }
  }

  /* ================= UI ================= */

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Leads</h1>

        <Link
          href="/dashboard/leads/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          + New Lead
        </Link>
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {STAGE_FILTERS.map(filter => {
          const isActive =
            (!filter.value && !stageFilter) ||
            filter.value === stageFilter

          return (
            <button
              key={filter.label}
              onClick={() => applyFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border
                ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading leads...</p>
      ) : leads.length === 0 ? (
        <p>No leads found.</p>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">Client Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Flow</th>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {leads.map(lead => {
                const stage = lead.current_stage?.stage_name ?? '—'

                return (
                  <tr key={lead.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {lead.client_name}
                    </td>
                    <td className="px-4 py-3">{lead.phone}</td>
                    <td className="px-4 py-3">{lead.email}</td>
                    <td className="px-4 py-3 capitalize">
                      {lead.insurence_category}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {lead.policy_flow}
                    </td>
                    <td className="px-4 py-3">
                      <StageBadge stage={stage} />
                    </td>
                    <td className="px-4 py-3">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3 flex items-center gap-3">
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                        title="View Lead"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>

                      {stage === 'Quoting in Progress' && (
                        <Link
                          href={`/dashboard/leads/send-form?id=${lead.id}`}
                          className="text-green-600 hover:underline font-medium flex items-center gap-1"
                          title="Send Initial Email"
                        >
                          <Send className="w-4 h-4" />
                          Send Initial Email
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ================= STAGE BADGE ================= */

function StageBadge({ stage }: { stage: string }) {
  const color =
    stage === 'Quoting in Progress'
      ? 'bg-yellow-100 text-yellow-800'
      : stage === 'Quote Has Been Emailed'
      ? 'bg-blue-100 text-blue-800'
      : stage === 'Consent Letter Sent'
      ? 'bg-purple-100 text-purple-800'
      : stage === 'Completed'
      ? 'bg-green-100 text-green-800'
      : stage === 'Did Not Bind'
      ? 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800'

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
      {stage}
    </span>
  )
}
