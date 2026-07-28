'use client';

import React from 'react';
import { X } from 'lucide-react';
import { StageCode, MortgageStageHistory } from '@/app/mortgage/lib/types';
import StageHistorySection from './StageHistorySection';

interface StageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string | null;
  currentStage: StageCode | null;
  onEditHistory?: (record: MortgageStageHistory) => void;
}

export default function StageHistoryModal({
  isOpen,
  onClose,
  loanId,
  currentStage,
  onEditHistory,
}: StageHistoryModalProps) {
  if (!isOpen || !loanId || !currentStage) return null;

  return (
    <div className="relative z-[110]" aria-labelledby="history-modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto relative">
            
            {/* Header matching CSR */}
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[#10B889] to-[#2E5C85] sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-white" id="history-modal-title">Stage History</h2>
                <p className="text-sm text-white/90">Previous updates for this mortgage application</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-red-100 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 shadow-sm"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body - Wrapper for StageHistorySection */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <StageHistorySection 
                  loanId={loanId} 
                  currentStage={currentStage} 
                  onEditHistory={onEditHistory} 
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
