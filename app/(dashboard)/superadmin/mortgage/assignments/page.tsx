'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { MortgageLoan } from '@/app/mortgage/lib/types'
import { EXCEL_LOAN_OFFICERS, EXCEL_PROCESSORS } from '@/app/mortgage/lib/excelLookups'
import Loading, { Spinner } from '@/components/ui/Loading'
import { toast } from '@/lib/toast'
import { Users, Briefcase, CheckCircle2 } from 'lucide-react'

export default function SuperAdminMortgageAssignmentsWrapper() {
  const [loans, setLoans] = useState<MortgageLoan[]>([])
  const [officers, setOfficers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['mortgage', 'admin', 'superadmin'])

      if (profData) setOfficers(profData)

      const res = await fetch('/api/mortgage/loans')
      const json = await res.json()
      if (json.success && json.data) {
        setLoans(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAssignment = async (loanId: string, field: 'loan_officer_name' | 'processor_name' | 'assigned_mortgage_officer', value: string) => {
    setUpdatingId(loanId)
    try {
      const payload: any = { [field]: value || null }
      const res = await fetch(`/api/mortgage/loans/${loanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success && json.data) {
        toast('Assignment updated successfully', 'success')
        setLoans(prev => prev.map(l => (l.id === loanId ? json.data : l)))
      } else {
        toast(json.error || 'Failed to update assignment', 'error')
      }
    } catch (err) {
      toast('Error updating assignment', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <Loading message="Loading mortgage assignments..." />
  }

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12 p-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-[#10B889]" />
            Mortgage Officer Assignments
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Reassign loan officers, processors, and assigned portal officers across all active mortgage applications.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
              <tr>
                <th className="py-3 px-4">Borrower / Loan</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Loan Officer (Text/Lookup)</th>
                <th className="py-3 px-4">Processor</th>
                <th className="py-3 px-4">Assigned Portal User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-800">
                    <div>{loan.client_name}</div>
                    <div className="text-xs text-gray-500 font-normal">{loan.loan_type || 'Loan'} · {loan.transaction_type || 'N/A'} · ${loan.loan_amount?.toLocaleString() || 0}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-bold border border-blue-200">
                      {loan.stage}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={loan.loan_officer_name || ''}
                      onChange={e => handleUpdateAssignment(loan.id, 'loan_officer_name', e.target.value)}
                      disabled={updatingId === loan.id}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-800 focus:ring-2 focus:ring-[#10B889] outline-none"
                    >
                      <option value="">Unassigned</option>
                      {EXCEL_LOAN_OFFICERS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={loan.processor_name || ''}
                      onChange={e => handleUpdateAssignment(loan.id, 'processor_name', e.target.value)}
                      disabled={updatingId === loan.id}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-800 focus:ring-2 focus:ring-[#10B889] outline-none"
                    >
                      <option value="">Unassigned</option>
                      {EXCEL_PROCESSORS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={loan.assigned_mortgage_officer || ''}
                      onChange={e => handleUpdateAssignment(loan.id, 'assigned_mortgage_officer', e.target.value)}
                      disabled={updatingId === loan.id}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-gray-800 focus:ring-2 focus:ring-[#10B889] outline-none"
                    >
                      <option value="">Unassigned Portal Profile</option>
                      {officers.map(off => (
                        <option key={off.id} value={off.id}>{off.full_name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No active mortgage loans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
