'use client'

import React, { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Landmark,
  X
} from 'lucide-react'
import { toast } from '@/lib/toast'

interface LenderSelectionStageUIProps {
  loanId?: string
  borrowerName?: string
  availableBanks?: { id: string; bank_id: string; bank?: { bank_name: string } }[]
  onClose?: () => void
  onSave?: (selectedBankId: string, selectedBankName: string) => void
}

export default function LenderSelectionStageUI({
  loanId = 'AL-1004',
  borrowerName = 'Apex Logistics LLC',
  availableBanks = [],
  onClose,
  onSave
}: LenderSelectionStageUIProps) {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)

  const handleSave = () => {
    if (!selectedBankId) {
      toast('Please select a final lender', 'error')
      return
    }

    const selectedBank = availableBanks.find(b => b.bank_id === selectedBankId)
    const bankName = selectedBank?.bank?.bank_name || 'Unknown Bank'
    
    toast(`Final lender ${bankName} selected!`, 'success')
    if (onSave) onSave(selectedBankId, bankName)
  }

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">
            <Building2 size={14} />
            <span>Accurate Lending Pipeline Stage UI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Stage 6: Which Lender is Providing Loan?
          </h2>
          <p className="text-xs sm:text-sm text-white/85 mt-1 max-w-2xl">
            Select the final lender bank from the participating banks that have submitted term sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-xs">
          <div>
            <span className="text-white/70 block uppercase text-[10px] font-bold">Borrower File</span>
            <span className="font-extrabold text-white">{borrowerName} ({loanId})</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">
          Select Final Lender
        </h3>
        
        {availableBanks.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-500">
            No participating banks found for this loan. You must assign banks in a previous stage or edit the loan to add banks.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableBanks.map(bank => {
              const bankName = bank.bank?.bank_name || 'Unknown Bank'
              const isSelected = selectedBankId === bank.bank_id
              
              return (
                <div
                  key={bank.id}
                  onClick={() => setSelectedBankId(bank.bank_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'border-[#10B889] bg-emerald-50 text-slate-900 shadow-md ring-1 ring-[#10B889]' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#10B889] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Landmark size={20} />
                    </div>
                    <span className="font-bold text-sm">{bankName}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="text-[#10B889]" size={20} />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          <strong className="text-slate-800">Note:</strong> This selection will be recorded in the stage history.
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
            disabled={!selectedBankId}
            onClick={handleSave}
            className="px-6 py-2.5 disabled:opacity-50 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Confirm Final Lender</span>
          </button>
        </div>
      </div>
    </div>
  )
}
