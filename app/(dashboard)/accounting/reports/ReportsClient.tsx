'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/currency'
import { 
  DollarSign, 
  Percent, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  FileText, 
  BarChart2, 
  User, 
  Clock,
  ShieldCheck,
  AlertCircle,
  Info,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Layers
} from 'lucide-react'

interface ReportsClientProps {
  csrs: any[]
}

export default function ReportsClient({ csrs }: ReportsClientProps) {
  const { showToast } = useToast()

  // --- Filter States ---
  // Default date range: 30 days ago to today
  const defaultStartDate = () => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  }
  const defaultEndDate = () => {
    return new Date().toISOString().split('T')[0]
  }

  const [startDate, setStartDate] = useState<string>(defaultStartDate())
  const [endDate, setEndDate] = useState<string>(defaultEndDate())
  const [accountingStatus, setAccountingStatus] = useState<string>('all')
  const [accountingVerified, setAccountingVerified] = useState<string>('all')
  const [policyFlow, setPolicyFlow] = useState<string>('all')
  const [carrier, setCarrier] = useState<string>('all')
  const [assignedCsr, setAssignedCsr] = useState<string>('all')

  // --- Dynamic Option Lists ---
  const [availableCarriers, setAvailableCarriers] = useState<string[]>([])
  const [availableFlows, setAvailableFlows] = useState<string[]>([])

  // --- Data States ---
  const [leads, setLeads] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch carriers & flows on mount
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const { data } = await supabase
          .from('temp_leads_basics')
          .select('carrier, policy_flow')
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
    fetchDropdowns()
  }, [])

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true)
    try {
      // 1. Fetch filtered leads
      let query = supabase
        .from('temp_leads_basics')
        .select(`
          id,
          client_name,
          policy_number,
          carrier,
          policy_flow,
          insurence_category,
          effective_date,
          total_premium,
          expected_commission,
          actual_commission,
          accounting_status,
          accounting_verified,
          created_at,
          assigned_csr,
          assigned_user_profile:profiles!fk_profile (
            full_name
          )
        `)

      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString())
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query = query.lte('created_at', end.toISOString())
      }
      if (accountingStatus !== 'all') {
        if (accountingStatus === 'unreconciled') {
          query = query.or('accounting_status.eq.unreconciled,accounting_status.is.null')
        } else {
          query = query.eq('accounting_status', accountingStatus)
        }
      }
      if (accountingVerified !== 'all') {
        query = query.eq('accounting_verified', accountingVerified === 'verified')
      }
      if (policyFlow !== 'all') {
        query = query.eq('policy_flow', policyFlow)
      }
      if (carrier !== 'all') {
        query = query.eq('carrier', carrier)
      }
      if (assignedCsr !== 'all') {
        query = query.eq('assigned_csr', assignedCsr)
      }

      const { data, error } = await query
      if (error) throw error
      setLeads(data || [])

      // 2. Fetch recent activity logs
      let logsQuery = supabase
        .from('accounting_logs')
        .select(`
          id,
          created_at,
          old_expected_commission,
          new_expected_commission,
          old_actual_commission,
          new_actual_commission,
          old_status,
          new_status,
          notes,
          updater:profiles!updated_by (
            full_name
          ),
          lead:temp_leads_basics!lead_id (
            client_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      const { data: logsData } = await logsQuery
      setLogs(logsData || [])

    } catch (e: any) {
      console.error(e)
      showToast('Error generating report: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load report data on mount & when filters update
  useEffect(() => {
    fetchReportData()
  }, [startDate, endDate, accountingStatus, accountingVerified, policyFlow, carrier, assignedCsr])

  // --- Aggregate Computations ---
  // 1. Premiums
  const totalPremiums = leads.reduce((sum, r) => sum + (Number(r.total_premium) || 0), 0)
  const averagePremium = leads.length > 0 ? totalPremiums / leads.length : 0

  // Premiums by flow
  const premiumsByFlow = leads.reduce((acc: { [key: string]: number }, lead) => {
    const flow = lead.policy_flow || 'Unspecified Flow'
    acc[flow] = (acc[flow] || 0) + (Number(lead.total_premium) || 0)
    return acc
  }, {})

  // Premiums by carrier
  const premiumsByCarrier = leads.reduce((acc: { [key: string]: number }, lead) => {
    const carrierName = lead.carrier || 'Unspecified Carrier'
    acc[carrierName] = (acc[carrierName] || 0) + (Number(lead.total_premium) || 0)
    return acc
  }, {})

  // 2. Commissions
  const expectedCommissions = leads.reduce((sum, r) => sum + (Number(r.expected_commission) || 0), 0)
  const actualCommissions = leads.reduce((sum, r) => sum + (Number(r.actual_commission) || 0), 0)
  const commissionDiscrepancies = expectedCommissions - actualCommissions
  const collectionPercentage = expectedCommissions > 0 ? (actualCommissions / expectedCommissions) * 100 : 0

  // 3. Reconciliation Stats
  let reconciledCount = 0
  let discrepancyCount = 0
  let unreconciledCount = 0
  let pendingCount = 0

  leads.forEach(lead => {
    const status = lead.accounting_status?.toLowerCase()
    if (status === 'reconciled') {
      reconciledCount++
    } else if (status === 'discrepancy') {
      discrepancyCount++
    } else if (status === 'unreconciled') {
      unreconciledCount++
    } else {
      pendingCount++ // Awaiting or Null
    }
  })

  // --- Export Actions ---
  const handleExportCSV = () => {
    if (leads.length === 0) {
      showToast('No data available to export.', 'error')
      return
    }

    const headers = [
      'Client Name',
      'Policy Number',
      'Carrier',
      'Policy Flow',
      'Insurance Category',
      'Effective Date',
      'Total Premium',
      'Expected Commission',
      'Actual Commission',
      'Accounting Status',
      'Accounting Verified',
      'Created Date'
    ]

    const csvRows = [
      headers.join(','),
      ...leads.map(lead => {
        const clientName = `"${(lead.client_name || '').replace(/"/g, '""')}"`
        const policyNumber = `"${(lead.policy_number || '').replace(/"/g, '""')}"`
        const carrierName = `"${(lead.carrier || '').replace(/"/g, '""')}"`
        const flow = `"${(lead.policy_flow || '').replace(/"/g, '""')}"`
        const cat = `"${(lead.insurence_category || '').replace(/"/g, '""')}"`
        const dateStr = lead.effective_date || 'N/A'
        const premium = lead.total_premium ?? 0
        const expected = lead.expected_commission ?? 0
        const actual = lead.actual_commission ?? 0
        const status = lead.accounting_status || 'unreconciled'
        const verified = lead.accounting_verified ? 'YES' : 'NO'
        const created = lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'

        return [
          clientName,
          policyNumber,
          carrierName,
          flow,
          cat,
          dateStr,
          premium,
          expected,
          actual,
          status,
          verified,
          created
        ].join(',')
      })
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `accounting_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('CSV report downloaded successfully.', 'success')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto print-container">
      {/* Dynamic Printing Rules */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, nav, aside, .no-print, button, select, input {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* ── Header (no-print) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div className="space-y-1">
          <Link href="/accounting">
            <button className="flex items-center gap-2 text-sm font-bold text-[#2E5C85] hover:text-[#2E5C85]/80 transition">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight leading-tight mt-1">
            Financial & Accounting Reports
          </h1>
          <p className="text-gray-500 text-sm">
            Generate detailed audit lists, track collection rates, and export statements.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button 
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-[#10B889] hover:bg-[#10B889]/90 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition"
          >
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 border border-gray-200 rounded-xl font-bold text-xs shadow-sm transition"
          >
            <Printer size={14} /> Print Summary
          </button>
        </div>
      </div>

      {/* ── Filter Form Panel (no-print) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 no-print">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
          <div className="p-1.5 bg-blue-50 text-[#2E5C85] rounded-lg">
            <Search size={16} />
          </div>
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">Report Filters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Accounting Status</label>
            <select
              value={accountingStatus}
              onChange={e => setAccountingStatus(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="reconciled">Reconciled</option>
              <option value="discrepancy">Discrepancy</option>
              <option value="unreconciled">Unreconciled</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Verification</label>
            <select
              value={accountingVerified}
              onChange={e => setAccountingVerified(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Policy Flow</label>
            <select
              value={policyFlow}
              onChange={e => setPolicyFlow(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none"
            >
              <option value="all">All Flows</option>
              {availableFlows.map(flow => (
                <option key={flow} value={flow}>{flow}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Carrier</label>
            <select
              value={carrier}
              onChange={e => setCarrier(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none"
            >
              <option value="all">All Carriers</option>
              {availableCarriers.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Assigned CSR</label>
            <select
              value={assignedCsr}
              onChange={e => setAssignedCsr(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white focus:outline-none"
            >
              <option value="all">All CSRs</option>
              {csrs.map(c => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.role})</option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end">
            <button 
              onClick={fetchReportData}
              className="w-full bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 py-1.5 rounded-xl font-bold text-xs shadow-sm transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400 font-bold bg-white border border-gray-100 rounded-2xl">
          Generating report details...
        </div>
      ) : leads.length === 0 ? (
        <div className="p-12 text-center text-gray-400 font-bold bg-white border border-gray-100 rounded-2xl">
          No records matched the selected reporting filters.
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── REPORT SUMMARY SECTION ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Premium Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                <div className="p-1.5 bg-blue-50 text-[#2E5C85] rounded-lg">
                  <Layers size={16} />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Premium Summary</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Total Premiums</p>
                    <p className="text-base font-black text-gray-900 mt-1">{formatCurrency(totalPremiums)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Avg Premium</p>
                    <p className="text-base font-black text-gray-900 mt-1">{formatCurrency(averagePremium)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">By Policy Flow</p>
                  <div className="space-y-1.5">
                    {Object.entries(premiumsByFlow).map(([flow, value]) => (
                      <div key={flow} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 font-medium">{flow}</span>
                        <span className="font-bold text-gray-800">{formatCurrency(value as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">By Carrier</p>
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {Object.entries(premiumsByCarrier).map(([cName, value]) => (
                      <div key={cName} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 font-medium truncate max-w-[120px]">{cName}</span>
                        <span className="font-bold text-gray-800">{formatCurrency(value as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Commission Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TrendingUp size={16} />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Commission Summary</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Expected Comm</p>
                    <p className="text-base font-black text-emerald-600 mt-1">{formatCurrency(expectedCommissions)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Collected Comm</p>
                    <p className="text-base font-black text-purple-600 mt-1">{formatCurrency(actualCommissions)}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">Commission Discrepancies</span>
                    <span className={`font-bold ${commissionDiscrepancies > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {formatCurrency(commissionDiscrepancies)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-medium">Collection Percentage</span>
                      <span className="font-black text-gray-800">{collectionPercentage.toFixed(1)}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(collectionPercentage, 100)}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Reconciliation Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
                <div className="p-1.5 bg-orange-50 text-[#E07A5F] rounded-lg">
                  <ShieldCheck size={16} />
                </div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Reconciliation Summary</h3>
              </div>

              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-gray-600">Reconciled Policies</span>
                  </div>
                  <span className="font-black text-gray-800">{reconciledCount}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E07A5F]" />
                    <span className="font-bold text-gray-600">Discrepancy Policies</span>
                  </div>
                  <span className="font-black text-gray-800">{discrepancyCount}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2E5C85]" />
                    <span className="font-bold text-gray-600">Unreconciled Policies</span>
                  </div>
                  <span className="font-black text-gray-800">{unreconciledCount}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <span className="font-bold text-gray-600">Pending Verification</span>
                  </div>
                  <span className="font-black text-gray-800">{pendingCount}</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── 4. Recent Accounting Activity Summary ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Clock size={16} />
              </div>
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">Recent Activity Logs</h3>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                No activity audits found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {logs.slice(0, 4).map((log) => {
                  const operator = log.updater?.full_name || 'System Operator'
                  const client = log.lead?.client_name || 'Deleted Lead'
                  return (
                    <div key={log.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-gray-400 font-semibold text-[10px]">
                        <span className="flex items-center gap-1"><User size={10} /> {operator}</span>
                        <span>{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 font-bold">
                        Client: {client}
                      </p>
                      <p className="text-gray-500 mt-0.5">
                        {log.old_status !== log.new_status && `Status: ${log.old_status || 'N/A'} → ${log.new_status}. `}
                        {(log.old_expected_commission !== log.new_expected_commission || log.old_actual_commission !== log.new_actual_commission) && `Commissions updated.`}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Filtered Leads Report Table ── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Filtered Report Statements</h3>
              <span className="text-xs text-gray-500 font-bold">{leads.length} StatementRows</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[900px]">
                <thead className="bg-gray-100 text-gray-600 uppercase text-[9px] font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Client Name</th>
                    <th className="px-4 py-3">Carrier / Flow</th>
                    <th className="px-4 py-3 text-right">Premium</th>
                    <th className="px-4 py-3 text-right">Expected Comm</th>
                    <th className="px-4 py-3 text-right">Actual Comm</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Verified</th>
                    <th className="px-4 py-3">Effective Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {leads.map(lead => {
                    const statusLower = lead.accounting_status?.toLowerCase()
                    const statusColor = 
                      statusLower === 'reconciled' ? 'text-emerald-600 bg-emerald-50' : 
                      statusLower === 'discrepancy' ? 'text-orange-600 bg-orange-50' :
                      statusLower === 'unreconciled' ? 'text-blue-600 bg-blue-50' :
                      'text-gray-600 bg-gray-50'

                    return (
                      <tr key={lead.id} className="hover:bg-gray-50/40 transition">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-gray-800">{lead.client_name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{lead.policy_number || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          <p className="font-semibold">{lead.carrier || 'N/A'}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{lead.policy_flow}</p>
                        </td>
                        <td className="px-4 py-3.5 text-right font-semibold text-gray-700">
                          {formatCurrency(lead.total_premium)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                          {formatCurrency(lead.expected_commission)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-purple-600">
                          {formatCurrency(lead.actual_commission)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${statusColor}`}>
                            {lead.accounting_status || 'unreconciled'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {lead.accounting_verified ? (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-purple-50 text-purple-600">YES</span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-gray-50 text-gray-400">NO</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 font-medium">
                          {lead.effective_date || 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
