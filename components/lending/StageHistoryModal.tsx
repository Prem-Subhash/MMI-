'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/lib/toast'
import { Spinner } from '@/components/ui/Loading'
import { LENDING_STAGE_FIELDS } from '@/app/lending/lib/constants'
import { Modal } from '@/components/ui/Modal'

type Props = {
  loanId: string
  borrowerName: string
  onClose: () => void
}

export default function StageHistoryModal({ loanId, borrowerName, onClose }: Props) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/lending/loans/${loanId}/history`)
        const data = await res.json()

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch history')
        }

        setHistory(data.history || [])
      } catch (err: any) {
        toast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [loanId])

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Stage History"
      subtitle={borrowerName}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Spinner size={32} />
              <p className="font-medium">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-emerald-500 bg-white rounded-xl border border-dashed border-slate-300">
              No stage history found for this loan.
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-emerald-50/50 px-5 py-3 border-b border-emerald-100 flex items-center justify-between">
                  <h3 className="font-bold text-emerald-700">{item.current_stage}</h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                    {new Date(item.changed_at).toLocaleString()}
                  </span>
                </div>
                {item.stage_data && Object.keys(item.stage_data).length > 0 ? (
                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                      {Object.entries(item.stage_data).map(([k, v]) => {
                        // Attempt to find friendly label from constants
                        const activeFields = LENDING_STAGE_FIELDS[item.current_stage] || {}
                        const friendlyLabel = activeFields[k]?.label || k.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                        
                        let displayValue = String(v)
                        
                        // Formatting logic
                        const lowerK = k.toLowerCase()
                        if (lowerK.includes('amount') || lowerK.includes('fee')) {
                          displayValue = `$${Number(v).toLocaleString()}`
                        }

                        return (
                          <div key={k}>
                            <span className="text-slate-500 block text-xs font-medium mb-1 uppercase tracking-wider">{friendlyLabel}</span>
                            <span className="font-medium text-slate-800 break-words">{displayValue}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-sm text-slate-400 italic text-center">
                    No additional metadata recorded for this stage
                  </div>
                )}
                {item.remarks && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-sm text-slate-600">
                    <span className="font-bold text-slate-700 mr-2">Remarks:</span>
                    {item.remarks}
                  </div>
                )}
              </div>
            ))
          )}
      </div>

      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 h-[46px]"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
