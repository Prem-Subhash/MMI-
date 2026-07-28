'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  ListChecks,
  X,
  FileCheck2,
  Building2
} from 'lucide-react'
import { toast } from '@/lib/toast'

interface ClosingChecklistStageUIProps {
  loanId?: string
  borrowerName?: string
  currentStage: number
  onClose?: () => void
  onSave?: (completedItems: string[]) => void
}

const DEFAULT_CHECKLIST = [
  'Signed Loan Agreement',
  'Personal Guarantees Executed',
  'Borrower Bank Account Setup Verified',
  'Hazard / Property Insurance Verified',
  'Life Insurance Assignment Verified',
  'Good Standing Certificates Received',
  'Final Closing Fees Paid',
  'Title Insurance Policy Received'
]

export default function ClosingChecklistStageUI({
  loanId = 'AL-1004',
  borrowerName = 'Apex Logistics LLC',
  currentStage,
  onClose,
  onSave
}: ClosingChecklistStageUIProps) {
  const [completedItems, setCompletedItems] = useState<string[]>([])
  
  const stageName = currentStage === 15 
    ? '15. Closing Checklist \u2013 Received'
    : currentStage === 16
    ? '16. Closing Checklist \u2013 In Process'
    : '17. Closing Checklist \u2013 Completed'

  const toggleItem = (item: string) => {
    if (completedItems.includes(item)) {
      setCompletedItems(prev => prev.filter(i => i !== item))
    } else {
      setCompletedItems(prev => [...prev, item])
    }
  }

  const handleSave = () => {
    if (currentStage === 17 && completedItems.length < DEFAULT_CHECKLIST.length) {
      toast('All items must be completed before moving to Stage 17 (Completed).', 'error')
      return
    }
    toast(`Saved Closing Checklist for ${stageName}`, 'success')
    if (onSave) onSave(completedItems)
  }

  const progressPercent = Math.round((completedItems.length / DEFAULT_CHECKLIST.length) * 100)

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      <div className="bg-gradient-to-r from-purple-800 to-indigo-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">
            <ListChecks size={14} />
            <span>Closing Phase</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {stageName}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-xs">
          <div>
            <span className="text-white/70 block uppercase text-[10px] font-bold">Borrower File</span>
            <span className="font-extrabold text-white">{borrowerName} ({loanId})</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Final Closing Documents &amp; Tasks
            </h3>
            <p className="text-xs text-slate-500">
              Check off completed items as you receive and verify them.
            </p>
          </div>
          <div className="w-full sm:w-48">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-slate-500 uppercase tracking-wider">Progress</span>
              <span className="text-indigo-700">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {DEFAULT_CHECKLIST.map((item, idx) => {
            const isChecked = completedItems.includes(item)
            return (
              <div 
                key={idx}
                onClick={() => toggleItem(item)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isChecked 
                    ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50' 
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                  isChecked 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'bg-white border-gray-300 text-transparent'
                }`}>
                  <CheckCircle2 size={16} strokeWidth={3} />
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck2 size={16} className={isChecked ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className={`text-sm font-semibold ${isChecked ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {item}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          <strong className="text-slate-800">Note:</strong> Information will be logged in stage history.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Save Closing Checklist</span>
          </button>
        </div>
      </div>
    </div>
  )
}
