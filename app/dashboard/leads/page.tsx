'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Search } from 'lucide-react'

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
  const [searchTerm, setSearchTerm] = useState('')

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
        .eq('insurence_category', 'personal')
        .eq('policy_flow', 'new')
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
    // Check if the current filter is already selected to allow toggling off if needed, 
    // or just push the new route. 
    // Logic below matches original: direct push.
    if (!stage) {
      router.push('/dashboard/leads')
    } else {
      router.push(`/dashboard/leads?stage=${encodeURIComponent(stage)}`)
    }
  }

  // Client-side search filtering
  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase()
    return (
      (lead.client_name && lead.client_name.toLowerCase().includes(term)) ||
      (lead.email && lead.email.toLowerCase().includes(term)) ||
      (lead.phone && lead.phone.includes(term))
    )
  })

  /* ================= UI ================= */


  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Leads</h1>

        <div className="flex gap-3">
             <Link
            href="/dashboard/leads/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
            + New Lead
            </Link>
        </div>
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
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
                ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }
              `}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* TOOLBAR */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search client, email, or phone..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-shadow"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                {filteredLeads.length} Lead{filteredLeads.length !== 1 && 's'} Found
            </div>
        </div>

        {loading ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p>Loading leads...</p>
            </div>
        ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
                No leads found matching your criteria.
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b border-gray-100 tracking-wider">
                <tr>
                    <th className="px-6 py-4 font-semibold">Client Name</th>
                    <th className="px-6 py-4 font-semibold">Phone</th>
                    <th className="px-6 py-4 font-semibold">Email</th>
                    <th className="px-6 py-4 font-semibold">Category</th>
                    <th className="px-6 py-4 font-semibold">Flow</th>
                    <th className="px-6 py-4 font-semibold">Stage</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                {filteredLeads.map(lead => {
                    const stage = lead.current_stage?.stage_name ?? '—'

                    return (
                    <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4 font-medium text-gray-900">
                        {lead.client_name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">{lead.phone}</td>
                        <td className="px-6 py-4 text-gray-600">{lead.email}</td>
                        <td className="px-6 py-4 capitalize text-gray-700">
                        {lead.insurence_category}
                        </td>
                        <td className="px-6 py-4 capitalize text-gray-700">
                        {lead.policy_flow}
                        </td>
                        <td className="px-6 py-4">
                        <StageBadge stage={stage} />
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-6 py-4 space-x-3">
                        <Link
                            href={`/dashboard/leads/${lead.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs uppercase tracking-wide transition-colors"
                        >
                            View
                        </Link>

                        {stage === 'Quoting in Progress' && (
                            <Link
                            href={`/dashboard/leads/send-form?id=${lead.id}`}
                            className="text-emerald-600 hover:text-emerald-800 font-medium text-xs uppercase tracking-wide transition-colors"
                            >
                            Send Email
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
    </div>
  )
}

/* ================= STAGE BADGE ================= */

function StageBadge({ stage }: { stage: string }) {
  const color =
    stage === 'Quoting in Progress'
      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      : stage === 'Quote Has Been Emailed'
      ? 'bg-blue-50 text-blue-700 border border-blue-200'
      : stage === 'Consent Letter Sent'
      ? 'bg-purple-50 text-purple-700 border border-purple-200'
      : stage === 'Completed'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : stage === 'Did Not Bind'
      ? 'bg-red-50 text-red-700 border border-red-200'
      : 'bg-gray-50 text-gray-700 border border-gray-200'

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {stage}
    </span>
  )
}
