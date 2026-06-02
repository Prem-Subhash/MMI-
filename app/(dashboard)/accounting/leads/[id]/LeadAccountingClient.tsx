'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/currency'
import { 
  ArrowLeft, 
  DollarSign, 
  Percent, 
  Calendar, 
  FileText, 
  History, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Layers,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw,
  Hash
} from 'lucide-react'

interface LeadAccountingClientProps {
  initialLead: any
  initialLogs: any[]
  leadId: string
}

export default function LeadAccountingClient({ 
  initialLead, 
  initialLogs, 
  leadId 
}: LeadAccountingClientProps) {
  const router = useRouter()
  const { showToast } = useToast()

  // --- State Variables ---
  const [lead, setLead] = useState(initialLead)
  const [logs, setLogs] = useState(initialLogs)
  const [refreshing, setRefreshing] = useState(false)

  // Input states
  const [expectedCommissionInput, setExpectedCommissionInput] = useState<number>(lead.expected_commission ?? 0)
  const [actualCommissionInput, setActualCommissionInput] = useState<number>(lead.actual_commission ?? 0)
  const [carrierPaymentDateInput, setCarrierPaymentDateInput] = useState<string>(lead.carrier_payment_date ?? '')
  const [commissionReceivedDateInput, setCommissionReceivedDateInput] = useState<string>(lead.commission_received_date ?? '')
  const [accountingStatusInput, setAccountingStatusInput] = useState<string>(lead.accounting_status ?? 'unreconciled')
  const [accountingVerifiedInput, setAccountingVerifiedInput] = useState<boolean>(lead.accounting_verified ?? false)
  const [accountingNotesInput, setAccountingNotesInput] = useState<string>(lead.accounting_notes ?? '')

  // Loading flags
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false)
  const [isVerifyingPolicy, setIsVerifyingPolicy] = useState(false)

  // --- Data Fetching ---
  const fetchLeadAndLogs = async () => {
    setRefreshing(true)
    try {
      // 1. Fetch Lead
      const { data: leadData, error: leadErr } = await supabase
        .from('temp_leads_basics')
        .select(`
          id,
          client_name,
          phone,
          email,
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
          accounting_notes,
          carrier_payment_date,
          commission_received_date,
          assigned_csr,
          assigned_user_profile:profiles!fk_profile (
            full_name
          )
        `)
        .eq('id', leadId)
        .single()

      if (leadErr) {
        throw leadErr
      }

      if (leadData) {
        setLead(leadData)
        setExpectedCommissionInput(leadData.expected_commission ?? 0)
        setActualCommissionInput(leadData.actual_commission ?? 0)
        setCarrierPaymentDateInput(leadData.carrier_payment_date ?? '')
        setCommissionReceivedDateInput(leadData.commission_received_date ?? '')
        setAccountingStatusInput(leadData.accounting_status ?? 'unreconciled')
        setAccountingVerifiedInput(leadData.accounting_verified ?? false)
        setAccountingNotesInput(leadData.accounting_notes ?? '')
      }

      // 2. Fetch Logs
      const { data: logsData, error: logsErr } = await supabase
        .from('accounting_logs')
        .select(`
          id,
          lead_id,
          updated_by,
          old_expected_commission,
          new_expected_commission,
          old_actual_commission,
          new_actual_commission,
          old_status,
          new_status,
          notes,
          created_at,
          updater:profiles!updated_by (
            full_name
          )
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (logsErr) {
        throw logsErr
      }

      if (logsData) {
        setLogs(logsData)
      }
    } catch (error: any) {
      console.error('Failed to sync accounting details:', error)
      showToast('Error syncing details with server.', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  // --- Handlers ---
  const handleUpdateCommission = async () => {
    if (expectedCommissionInput < 0 || actualCommissionInput < 0) {
      showToast('Commission values cannot be negative.', 'error')
      return
    }

    setIsUpdatingCommission(true)
    try {
      const res = await fetch('/api/accounting/update-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          expectedCommission: expectedCommissionInput,
          actualCommission: actualCommissionInput
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update commissions')
      }

      showToast(data.message || 'Commissions updated successfully.', 'success')
      await fetchLeadAndLogs()
      router.refresh()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsUpdatingCommission(false)
    }
  }

  const handleVerifyPolicy = async () => {
    if (actualCommissionInput < 0) {
      showToast('Actual commission cannot be negative.', 'error')
      return
    }

    setIsVerifyingPolicy(true)
    try {
      const res = await fetch('/api/accounting/verify-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          actualCommission: actualCommissionInput,
          accountingStatus: accountingStatusInput,
          accountingVerified: accountingVerifiedInput,
          accountingNotes: accountingNotesInput,
          carrierPaymentDate: carrierPaymentDateInput || null,
          commissionReceivedDate: commissionReceivedDateInput || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify policy')
      }

      showToast(data.message || 'Policy verification status updated.', 'success')
      await fetchLeadAndLogs()
      router.refresh()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setIsVerifyingPolicy(false)
    }
  }

  // Helper status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reconciled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
            <CheckCircle2 size={12} /> Reconciled
          </span>
        )
      case 'discrepancy':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-orange-50 text-orange-600 border border-orange-100 uppercase tracking-wide">
            <AlertCircle size={12} /> Discrepancy
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
            <Info size={12} /> Unreconciled
          </span>
        )
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <Link href="/accounting/all-leads">
            <button className="flex items-center gap-2 text-sm font-bold text-[#2E5C85] hover:text-[#2E5C85]/80 transition">
              <ArrowLeft size={16} /> Back to Accounting Leads
            </button>
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight leading-tight">
              {lead.client_name}
            </h1>
            {getStatusBadge(lead.accounting_status)}
            {lead.accounting_verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black rounded-full bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wider">
                <ShieldCheck size={10} /> Verified
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            ID: <span className="font-mono text-xs">{lead.id}</span>
          </p>
        </div>

        <button 
          onClick={fetchLeadAndLogs}
          disabled={refreshing}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 border border-gray-200 rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Syncing...' : 'Sync Database'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── LEFT COLUMN (POLICY INFO & AUDIT TRAIL) ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Client / Policy Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
              <div className="p-2 bg-blue-50 text-[#2E5C85] rounded-xl">
                <Layers size={18} />
              </div>
              <h2 className="text-lg font-black text-gray-800">Client & Policy Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Client Name</p>
                <p className="text-sm font-black text-gray-700">{lead.client_name || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Assigned CSR</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 flex items-center justify-center">
                    {lead.assigned_user_profile?.full_name?.[0] || 'U'}
                  </div>
                  <p className="text-sm font-bold text-gray-700">
                    {lead.assigned_user_profile?.full_name || 'Unassigned'}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Phone Number</p>
                <a href={lead.phone ? `tel:${lead.phone}` : '#'} className="text-sm font-bold text-[#2E5C85] hover:underline flex items-center gap-1">
                  <Phone size={12} /> {lead.phone || 'N/A'}
                </a>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Email Address</p>
                <a href={lead.email ? `mailto:${lead.email}` : '#'} className="text-sm font-bold text-[#2E5C85] hover:underline flex items-center gap-1 truncate block max-w-full">
                  <Mail size={12} className="shrink-0" /> {lead.email || 'N/A'}
                </a>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Carrier</p>
                <p className="text-sm font-bold text-gray-700">{lead.carrier || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Policy Number</p>
                <p className="text-sm font-bold text-gray-700 font-mono flex items-center gap-1">
                  <Hash size={12} /> {lead.policy_number || 'N/A'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Insurance Category</p>
                <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-gray-600">
                  {lead.insurence_category || 'N/A'}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Policy Flow</p>
                <span className="inline-flex px-2 py-0.5 text-xs font-bold rounded bg-gray-100 text-gray-600">
                  {lead.policy_flow || 'N/A'}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Effective Date</p>
                <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                  <Calendar size={12} /> {lead.effective_date || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Audit Logs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <History size={18} />
              </div>
              <h2 className="text-lg font-black text-gray-800">Reconciliation Audit Trail</h2>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No reconciliation audits logged for this policy.
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-6">
                {logs.map((log) => (
                  <div key={log.id} className="relative space-y-2">
                    {/* Circle marker */}
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-purple-400 flex items-center justify-center" />

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-gray-500 gap-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <User size={12} />
                        <span>{log.updater?.full_name || 'System Operator'}</span>
                      </div>
                      <span className="font-medium text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-2.5 text-xs text-gray-600">
                      {/* Commission Diff */}
                      {(log.old_expected_commission !== log.new_expected_commission || 
                        log.old_actual_commission !== log.new_actual_commission) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {log.old_expected_commission !== log.new_expected_commission && (
                            <div>
                              <span className="font-bold">Expected Commission:</span>{' '}
                              <span className="text-red-500">{formatCurrency(log.old_expected_commission)}</span>{' '}
                              →{' '}
                              <span className="text-emerald-600 font-bold">{formatCurrency(log.new_expected_commission)}</span>
                            </div>
                          )}
                          {log.old_actual_commission !== log.new_actual_commission && (
                            <div>
                              <span className="font-bold">Actual Commission:</span>{' '}
                              <span className="text-red-500">{formatCurrency(log.old_actual_commission)}</span>{' '}
                              →{' '}
                              <span className="text-emerald-600 font-bold">{formatCurrency(log.new_actual_commission)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Diff */}
                      {log.old_status !== log.new_status && (
                        <div>
                          <span className="font-bold">Status:</span>{' '}
                          <span className="line-through text-gray-400">{log.old_status || 'N/A'}</span>{' '}
                          →{' '}
                          <span className="text-[#2E5C85] font-bold uppercase text-[10px] tracking-wide bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                            {log.new_status}
                          </span>
                        </div>
                      )}

                      {/* Log Notes */}
                      {log.notes && (
                        <div className="border-t border-gray-100 pt-2 mt-1">
                          <p className="font-bold text-gray-400 text-[10px] uppercase">Internal Note</p>
                          <p className="text-gray-700 italic mt-0.5">{log.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (FINANCIALS, ACTION CONTROLS, VERIFICATION) ── */}
        <div className="space-y-6">
          
          {/* Section 2: Financial Info (Totals & Inputs) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign size={18} />
              </div>
              <h2 className="text-lg font-black text-gray-800">Financial Metrics</h2>
            </div>

            {/* Read-only KPI aggregates */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Bound Premium</p>
                <p className="text-xs font-black text-gray-900 mt-1">
                  {formatCurrency(lead.total_premium)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Expected Comm</p>
                <p className="text-xs font-black text-emerald-600 mt-1">
                  {formatCurrency(lead.expected_commission)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Actual Comm</p>
                <p className="text-xs font-black text-purple-600 mt-1">
                  {formatCurrency(lead.actual_commission)}
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
                  Expected Commission ($)
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Percent size={14} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expectedCommissionInput}
                    onChange={(e) => setExpectedCommissionInput(parseFloat(e.target.value) || 0)}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
                  Actual Commission ($)
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <DollarSign size={14} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={actualCommissionInput}
                    onChange={(e) => setActualCommissionInput(parseFloat(e.target.value) || 0)}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
                  Carrier Payment Date
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Calendar size={14} />
                  </div>
                  <input
                    type="date"
                    value={carrierPaymentDateInput}
                    onChange={(e) => setCarrierPaymentDateInput(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
                  Commission Received Date
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Calendar size={14} />
                  </div>
                  <input
                    type="date"
                    value={commissionReceivedDateInput}
                    onChange={(e) => setCommissionReceivedDateInput(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 & 4: Verification, Checkbox, Notes & Action buttons */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-50">
              <div className="p-2 bg-orange-50 text-[#E07A5F] rounded-xl">
                <ShieldCheck size={18} />
              </div>
              <h2 className="text-lg font-black text-gray-800">Verification & Controls</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
                  Accounting Status
                </label>
                <select
                  value={accountingStatusInput}
                  onChange={(e) => setAccountingStatusInput(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-700 bg-white"
                >
                  <option value="unreconciled">Unreconciled</option>
                  <option value="reconciled">Reconciled</option>
                  <option value="discrepancy">Discrepancy</option>
                </select>
              </div>

              {/* Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <input
                  type="checkbox"
                  id="accounting_verified"
                  checked={accountingVerifiedInput}
                  onChange={(e) => setAccountingVerifiedInput(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-gray-300 text-[#2E5C85] focus:ring-[#2E5C85] cursor-pointer"
                />
                <label 
                  htmlFor="accounting_verified" 
                  className="text-xs font-bold text-gray-600 cursor-pointer select-none"
                >
                  Confirm Policy Verified
                </label>
              </div>

              {/* Notes Textarea */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">
                  Reconciliation Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter details on payment match, commission rate mismatch, carrier details, or discrepancy resolutions..."
                  value={accountingNotesInput}
                  onChange={(e) => setAccountingNotesInput(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-700 placeholder-gray-400 resize-none"
                />
              </div>

              {/* Actions Grid */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleVerifyPolicy}
                  disabled={isVerifyingPolicy}
                  className="w-full bg-[#2E5C85] border border-[#2E5C85] text-white hover:bg-[#2E5C85]/90 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isVerifyingPolicy ? 'Verifying Policy...' : 'Verify Policy Status'}
                </button>
                
                <button
                  onClick={handleUpdateCommission}
                  disabled={isUpdatingCommission}
                  className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isUpdatingCommission ? 'Updating Commissions...' : 'Update Commissions Only'}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
