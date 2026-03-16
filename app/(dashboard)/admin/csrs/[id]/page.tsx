'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock,
  Mail,
  FileSignature,
  XCircle,
  AlertCircle,
  RefreshCw,
  User,
  Calendar,
  TrendingUp,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type CSRProfile = {
  id: string
  full_name: string
  email: string
  created_at: string
}

type Lead = {
  id: string
  client_name: string
  phone: string
  email: string
  insurence_category: string
  policy_flow: string
  policy_type: string
  created_at: string
  stage_name: string
}

// ─────────────────────────────────────────────
// Stage config
// ─────────────────────────────────────────────
const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'Quoting in Progress': {
    label: 'Quoting in Progress',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: <Clock size={14} />,
  },
  'Quote Has Been Emailed': {
    label: 'Quote Has Been Emailed',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Mail size={14} />,
  },
  'Same Declaration Emailed': {
    label: 'Same Declaration Emailed',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: <Mail size={14} />,
  },
  'Consent Letter Sent': {
    label: 'Consent Letter Sent',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: <FileSignature size={14} />,
  },
  'Completed': {
    label: 'Completed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle2 size={14} />,
  },
  'Completed (Same)': {
    label: 'Completed (Same)',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle2 size={14} />,
  },
  'Completed (Switch)': {
    label: 'Completed (Switch)',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: <CheckCircle2 size={14} />,
  },
  'Did Not Bind': {
    label: 'Did Not Bind',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <XCircle size={14} />,
  },
  'Cancelled': {
    label: 'Cancelled',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: <XCircle size={14} />,
  },
}

function getStageCfg(name: string) {
  return STAGE_CONFIG[name] ?? {
    label: name,
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: <AlertCircle size={14} />,
  }
}

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  accent: string
}) {
  return (
    <div className={`relative bg-white rounded-2xl border ${accent} p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
      <div className={`p-3 rounded-xl ${accent.replace('border-', 'bg-').replace('-200', '-100')} flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-5 ${accent.replace('border-', 'bg-').replace('-200', '-400')}`} />
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function CSRWorkloadPage() {
  const params = useParams()
  const csrId = params?.id as string

  const [csr, setCsr] = useState<CSRProfile | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    setLoading(true)

    // Fetch CSR profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('id', csrId)
      .single()

    setCsr(profile)

    // Fetch all leads assigned to this CSR with their current stage
    const { data: leadsData, error } = await supabase
      .from('temp_leads_basics')
      .select(`
        id,
        client_name,
        phone,
        email,
        insurence_category,
        policy_flow,
        policy_type,
        created_at,
        current_stage:pipeline_stages (
          stage_name
        )
      `)
      .eq('assigned_csr', csrId)
      .order('created_at', { ascending: false })

    if (!error && leadsData) {
      const formatted: Lead[] = (leadsData as any[]).map((row) => ({
        ...row,
        stage_name:
          (Array.isArray(row.current_stage)
            ? row.current_stage[0]?.stage_name
            : row.current_stage?.stage_name) ?? 'Unknown',
      }))
      setLeads(formatted)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (csrId) loadData()
  }, [csrId])

  // ── Derived Stats ──
  const totalLeads = leads.length
  const activeLeads = leads.filter(
    (l) => !['Completed', 'Completed (Same)', 'Completed (Switch)', 'Did Not Bind', 'Cancelled'].includes(l.stage_name)
  ).length
  const completedLeads = leads.filter((l) =>
    ['Completed', 'Completed (Same)', 'Completed (Switch)'].includes(l.stage_name)
  ).length
  const didNotBind = leads.filter((l) =>
    ['Did Not Bind', 'Cancelled'].includes(l.stage_name)
  ).length

  const conversionRate = totalLeads > 0
    ? Math.round((completedLeads / totalLeads) * 100)
    : 0

  // Stage breakdown for quick-filter pills
  const stageCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.stage_name] = (acc[lead.stage_name] ?? 0) + 1
    return acc
  }, {})

  // Filtered leads
  const filteredLeads = leads.filter((l) => {
    const matchesStage = selectedStage === 'all' || l.stage_name === selectedStage
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !term ||
      l.client_name?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term) ||
      l.phone?.includes(term) ||
      l.stage_name?.toLowerCase().includes(term)
    return matchesStage && matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Loading CSR workload...</p>
        </div>
      </div>
    )
  }

  if (!csr) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold text-lg">CSR not found</p>
          <Link href="/admin/csrs" className="text-emerald-600 text-sm hover:underline mt-2 inline-block">
            ← Back to CSR Management
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">

      {/* ── Header ── */}
      <div className="mb-8">
        <Link
          href="/admin/csrs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors mb-5 font-medium"
        >
          <ArrowLeft size={16} /> Back to CSR Management
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-100 flex-shrink-0">
              {csr.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                {csr.full_name}
              </h1>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
                <Mail size={13} /> {csr.email}
                <span className="mx-1 text-gray-300">·</span>
                <Calendar size={13} />
                Joined {new Date(csr.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <StatCard
          icon={<Briefcase size={20} className="text-blue-600" />}
          label="Total Leads"
          value={totalLeads}
          accent="border-blue-200"
        />
        <StatCard
          icon={<Clock size={20} className="text-yellow-600" />}
          label="Active"
          value={activeLeads}
          accent="border-yellow-200"
        />
        <StatCard
          icon={<CheckCircle2 size={20} className="text-emerald-600" />}
          label="Completed"
          value={completedLeads}
          accent="border-emerald-200"
        />
        <StatCard
          icon={<XCircle size={20} className="text-red-500" />}
          label="Did Not Bind"
          value={didNotBind}
          accent="border-red-200"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-purple-600" />}
          label="Conversion"
          value={`${conversionRate}%`}
          accent="border-purple-200"
        />
      </div>

      {/* ── Stage Breakdown Pills ── */}
      {Object.keys(stageCounts).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Filter by Stage
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                selectedStage === 'all'
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              All ({totalLeads})
            </button>
            {Object.entries(stageCounts).map(([stage, count]) => {
              const cfg = getStageCfg(stage)
              const isActive = selectedStage === stage
              return (
                <button
                  key={stage}
                  onClick={() => setSelectedStage(stage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isActive
                      ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cfg.icon}
                  {stage}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white/60' : 'bg-gray-100 text-gray-600'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Leads Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header / search */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Assigned Leads</h2>
              <p className="text-xs text-gray-500 mt-0.5">{filteredLeads.length} leads shown</p>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search client, email, stage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white transition-all"
          />
        </div>

        {filteredLeads.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Briefcase size={40} className="mb-3 opacity-30" />
            <p className="font-semibold text-gray-600">No leads found</p>
            <p className="text-sm mt-1">
              {searchTerm || selectedStage !== 'all'
                ? 'Try adjusting your filters.'
                : 'This CSR has no leads assigned yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left" style={{ minWidth: '780px' }}>
              <thead>
                <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white">
                  {['Client Name', 'Phone', 'Category', 'Flow', 'Stage', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => {
                  const cfg = getStageCfg(lead.stage_name)
                  return (
                    <tr key={lead.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{lead.client_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{lead.email}</div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{lead.phone || '—'}</td>
                      <td className="px-5 py-4 capitalize text-gray-700 whitespace-nowrap">
                        {lead.insurence_category || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
                          lead.policy_flow === 'new'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {lead.policy_flow === 'new' ? 'New Business' : 'Renewal'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.icon}
                          {lead.stage_name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs font-mono">
                        {new Date(lead.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
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
