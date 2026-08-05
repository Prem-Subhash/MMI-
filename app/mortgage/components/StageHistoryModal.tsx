'use client';

import React from 'react';
import { X } from 'lucide-react';
import { StageCode, MortgageStageHistory } from '@/app/mortgage/lib/types';
import StageHistorySection from './StageHistorySection';
import { Modal } from '@/components/ui/Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stage History"
      subtitle="Previous updates for this mortgage application"
      maxWidth="max-w-3xl"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <StageHistorySection 
          loanId={loanId} 
          currentStage={currentStage} 
          onEditHistory={onEditHistory} 
        />
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
  );
}
