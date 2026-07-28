'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  Eye, Search, AlertCircle, CheckCircle2, Info,
  ChevronLeft, ChevronRight, ShieldCheck, Filter, SlidersHorizontal
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import { formatCurrency } from '@/lib/currency'
import { getActivePolicy } from '@/utils/activePolicyHelper'

type Lead = {
  id: string
  client_name: string
  phone: string
  email: string
  insurence_category: string
  policy_flow: string
  created_at: string
  total_premium: number
  expected_commission: number
  actual_commission: number
  accounting_status: string
  accounting_verified: boolean
  carrier: string
  new_carrier?: string
  new_policy_number?: string
  new_premium?: number
  current_stage: { stage_name: string } | null
  assigned_csr_profile: { full_name: string } | null
}

const STAGE_FILTERS = [
  { label: 'All Stages', value: null },
  { label: 'New Lead', value: 'New Lead' },
  { label: 'Quoting', value: 'Quoting in Progress' },
  { label: 'Quote Sent', value: 'Quote Has Been Emailed' },
  { label: 'Consent Sent', value: 'Consent Letter Sent' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Did Not Bind', value: 'Did Not Bind' },
]

export default function AccountingAllLeadsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const stageFilter = searchParams.get('stage')

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const [accountingStatusFilter, setAccountingStatusFilter] = useState<string>('all')
  const [accountingVerifiedFilter, setAccountingVerifiedFilter] = useState<string>('all')
  const [policyFlowFilter, setPolicyFlowFilter] = useState<string>('all')
  const [carrierFilter, setCarrierFilter] = useState<string>('all')

  const [availableCarriers, setAvailableCarriers] = useState<string[]>([])
  const [availableFlows, setAvailableFlows] = useState<string[]>([])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const { data } = await supabase.from('temp_leads_basics').select('carrier, policy_flow')
        if (data) {
          const carriers = Array.from(new Set(data.map(d => d.carrier).filter(Boolean))) as string[]
          const flows = Array.from(new Set(data.map(d => d.policy_flow).filter(Boolean))) as string[]
          setAvailableCarriers(carriers.sort())
          setAvailableFlows(flows.sort())
        }
      } catch (err) {
        console.error('Failed to load filter options:', err)
      }
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    const loadLeads = async () => {
      setLoading(true)

      let query = supabase
        .from('temp_leads_basics')
        .select(`
          id, client_name, phone, email, insurence_category, policy_flow, created_at,
          total_premium, expected_commission, actual_commission,
          accounting_status, accounting_verified, carrier,
          new_carrier, new_policy_number, new_premium,
          current_stage:pipeline_stages${stageFilter ? '!inner' : ''} (stage_name),
          assigned_csr_profile:profiles!fk_profile (full_name)
        `)
        .order('created_at', { ascending: false })
        .range(page * 10, (page + 1) * 10 - 1)

      if (stageFilter) {
        if (stageFilter === 'Completed') {
          query = query.in('current_stage.stage_name', ['Completed', 'Completed (Same)', 'Completed (Switch)'])
        } else {
          query = query.eq('current_stage.stage_name', stageFilter)
        }
      }

      if (accountingStatusFilter !== 'all') {
        if (accountingStatusFilter === 'unreconciled') {
          query = query.or('accounting_status.eq.unreconciled,accounting_status.is.null')
        } else {
          query = query.eq('accounting_status', accountingStatusFilter)
        }
      }

      if (accountingVerifiedFilter !== 'all') {
        query = query.eq('accounting_verified', accountingVerifiedFilter === 'verified')
      }

      if (policyFlowFilter !== 'all') query = query.eq('policy_flow', policyFlowFilter)
      if (carrierFilter !== 'all') query = query.or(`carrier.eq.${carrierFilter},new_carrier.eq.${carrierFilter}`)

      const { data, error } = await query

      if (error) {
        console.error(error)
        setLeads([])
      } else {
        const formatted = (data as any[]).map(row => ({
          ...row,
          current_stage: Array.isArray(row.current_stage) ? row.current_stage[0] ?? null : row.current_stage ?? null,
          assigned_csr_profile: Array.isArray(row.assigned_csr_profile) ? row.assigned_csr_profile[0] ?? null : row.assigned_csr_profile ?? null,
        }))
        setLeads(formatted)
      }

      setLoading(false)
    }

    loadLeads()
  }, [stageFilter, page, accountingStatusFilter, accountingVerifiedFilter, policyFlowFilter, carrierFilter])

  const applyFilter = (stage: string | null) => {
    setPage(0)
    if (!stage) router.push('/accounting/all-leads')
    else router.push(`/accounting/all-leads?stage=${encodeURIComponent(stage)}`)
  }

  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase()
    return (
      (lead.client_name && lead.client_name.toLowerCase().includes(term)) ||
      (lead.email && lead.email.toLowerCase().includes(term)) ||
      (lead.phone && lead.phone.includes(term)) ||
      (lead.assigned_csr_profile?.full_name && lead.assigned_csr_profile.full_name.toLowerCase().includes(term))
    )
  })

  const activeFilterCount = [
    accountingStatusFilter !== 'all',
    accountingVerifiedFilter !== 'all',
    policyFlowFilter !== 'all',
    carrierFilter !== 'all',
  ].filter(Boolean).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">All Accounting Leads</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Audit policy premiums, commissions, and reconciliation status across all bound policies.
          </p>
        </div>

        
    
      </div>

      {/* ── Stage Filter Tabs ── */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {STAGE_FILTERS.map(filter => {
          const isActive = (!filter.value && !stageFilter) || filter.value === stageFilter
          return (
            <button
              key={filter.label}
              onClick={() => applyFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors
                ${isActive
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }
              `}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* ── Main Table Card ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search client, email, phone…"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-shadow"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
              {filteredLeads.length} result{filteredLeads.length !== 1 && 's'}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors inline-flex items-center gap-2
                ${showFilters || activeFilterCount > 0
                  ? 'bg-brand text-white border-brand shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                }
              `}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-md">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-b border-gray-100 bg-gray-50">
            {[
              {
                label: 'Recon Status', value: accountingStatusFilter,
                onChange: (v: string) => { setAccountingStatusFilter(v); setPage(0) },
                options: [
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Reconciled', value: 'reconciled' },
                  { label: 'Discrepancy', value: 'discrepancy' },
                  { label: 'Unreconciled', value: 'unreconciled' },
                ]
              },
              {
                label: 'Verification', value: accountingVerifiedFilter,
                onChange: (v: string) => { setAccountingVerifiedFilter(v); setPage(0) },
                options: [
                  { label: 'All', value: 'all' },
                  { label: 'Verified', value: 'verified' },
                  { label: 'Unverified', value: 'unverified' },
                ]
              },
              {
                label: 'Policy Flow', value: policyFlowFilter,
                onChange: (v: string) => { setPolicyFlowFilter(v); setPage(0) },
                options: [{ label: 'All Flows', value: 'all' }, ...availableFlows.map(f => ({ label: f, value: f }))]
              },
              {
                label: 'Carrier', value: carrierFilter,
                onChange: (v: string) => { setCarrierFilter(v); setPage(0) },
                options: [{ label: 'All Carriers', value: 'all' }, ...availableCarriers.map(c => ({ label: c, value: c }))]
              },
            ].map(({ label, value, onChange, options }) => (
              <div key={label} className="space-y-1.5 flex flex-col">
                <label className="text-[10px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-3 py-0.5 rounded-full w-fit whitespace-nowrap">
                  {label}
                </label>
                <div className="relative">
                  <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 appearance-none border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                  >
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table or Empty State */}
        {loading ? (
          <Loading message="Loading accounting leads…" />
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No leads found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left table-fixed" style={{ minWidth: '1400px' }}>
              <colgroup>
                <col className="w-[260px]" />
                <col className="w-[180px]" />
                <col className="w-[160px]" />
                <col className="w-[130px]" />
                <col className="w-[150px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[110px]" />
                <col className="w-[120px]" />
                <col className="w-[80px]" />
              </colgroup>
              <thead className="text-white uppercase text-xs border-b border-gray-100 tracking-wider">
                <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85]">
                  <th className="px-4 py-4 font-semibold">Client</th>
                  <th className="px-4 py-4 font-semibold">Category / Flow</th>
                  <th className="px-4 py-4 font-semibold">Stage</th>
                  <th className="px-4 py-4 font-semibold text-right">Premium</th>
                  <th className="px-4 py-4 font-semibold text-right">Expected Comm</th>
                  <th className="px-4 py-4 font-semibold text-right">Actual Comm</th>
                  <th className="px-4 py-4 font-semibold text-center">Recon Status</th>
                  <th className="px-4 py-4 font-semibold text-center">Verified</th>
                  <th className="px-4 py-4 font-semibold text-center">Created</th>
                  <th className="px-4 py-4 font-semibold text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredLeads.map(lead => {
                  const stage = lead.current_stage?.stage_name ?? '—'
                  const createdDate = lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'
                  const active = getActivePolicy(lead)

                  return (
                    <tr key={lead.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium text-gray-900 break-words">{lead.client_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 break-all">{lead.email}</p>
                      </td>
                      <td className="px-4 py-4 capitalize text-gray-700 align-top">
                        <p className="font-medium break-words">{lead.insurence_category}</p>
                        <p className="text-xs text-gray-500 mt-0.5 break-words">{lead.policy_flow}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <StageBadge stage={stage} />
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900 align-top">
                        {formatCurrency(active.activePremium)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900 align-top">
                        {formatCurrency(lead.expected_commission)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-900 font-medium align-top">
                        {formatCurrency(lead.actual_commission)}
                      </td>
                      <td className="px-4 py-4 text-center align-top">
                        <StatusBadge status={lead.accounting_status} />
                      </td>
                      <td className="px-4 py-4 text-center align-top">
                        <VerificationBadge verified={lead.accounting_verified} />
                      </td>
                      <td className="px-4 py-4 text-center text-gray-500 whitespace-nowrap align-top">
                        {createdDate}
                      </td>
                      <td className="px-4 py-4 text-center align-top">
                        <Link
                          href={`/accounting/leads/${lead.id}`}
                          className="text-brand-dark hover:text-[#B55D44] transition-colors p-1 rounded-md hover:bg-gray-100 inline-flex items-center justify-center"
                          title="Open Accounting Console"
                        >
                          <Eye size={18} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page + 1}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={leads.length < 10 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-Components ── */

function StageBadge({ stage }: { stage: string }) {
  const color =
    stage === 'Quoting in Progress'
      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      : stage === 'Quote Has Been Emailed'
        ? 'bg-blue-50 text-blue-700 border border-blue-200'
        : stage === 'Consent Letter Sent'
          ? 'bg-purple-50 text-purple-700 border border-purple-200'
          : stage === 'Completed' || stage === 'Completed (Same)' || stage === 'Completed (Switch)'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : stage === 'Did Not Bind'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-gray-50 text-gray-700 border border-gray-200'

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${color}`}>
      {stage}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  const map: Record<string, string> = {
    reconciled: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    discrepancy: 'bg-orange-50 text-orange-700 border border-orange-200',
    unreconciled: 'bg-blue-50 text-blue-700 border border-blue-200',
  }
  const cls = map[s] ?? 'bg-gray-50 text-gray-700 border border-gray-200'
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls} inline-flex items-center gap-1.5`}>
      {s === 'reconciled' && <CheckCircle2 size={12} />}
      {s === 'discrepancy' && <AlertCircle size={12} />}
      {s === 'unreconciled' && <Info size={12} />}
      {status || 'Unreconciled'}
    </span>
  )
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
      <CheckCircle2 size={12} /> Verified
    </span>
  ) : (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
      Pending
    </span>
  )
}