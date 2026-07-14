'use client';

import React from 'react';
import {
  X,
  Edit3,
  Trash2,
  ArrowRight,
  DollarSign,
  Calendar,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Layers,
  Building2,
} from 'lucide-react';
import { MortgageLoan, StageCode } from '@/app/mortgage/lib/types';
import { getStageConfig, MORTGAGE_STAGES } from '@/app/mortgage/lib/stageFields';
import StageHistorySection from './StageHistorySection';

interface LoanDetailModalProps {
  isOpen: boolean;
  loan: MortgageLoan | null;
  onClose: () => void;
  onEdit: (loan: MortgageLoan) => void;
  onEditStage?: (loan: MortgageLoan, targetStage: StageCode) => void;
  onDelete: (loan: MortgageLoan) => void;
  onMoveStage: (loan: MortgageLoan, newStage: any) => void;
}

export default function LoanDetailModal({
  isOpen,
  loan,
  onClose,
  onEdit,
  onEditStage,
  onDelete,
  onMoveStage,
}: LoanDetailModalProps) {
  if (!isOpen || !loan) return null;

  const stageConfig = getStageConfig(loan.stage);
  const availableStages = MORTGAGE_STAGES.filter((s) => s.pipeline === loan.pipeline_type);

  // Find current stage index and next stage
  const currentIndex = availableStages.findIndex((s) => s.code === loan.stage);
  const nextStage =
    currentIndex >= 0 && currentIndex < availableStages.length - 1
      ? availableStages[currentIndex + 1]
      : null;

  const handleUpdateStageClick = (targetCode: StageCode) => {
    if (onEditStage) {
      onEditStage(loan, targetCode);
    } else {
      onEdit({ ...loan, stage: targetCode });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                <Building2 size={13} />
                <span>
                  {loan.pipeline_type === 'NEW_LOAN' ? 'New Loan Pipeline (6 Stages)' : 'Pre-Approval Pipeline (2 Stages)'}
                </span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stageConfig.badgeBg} ${stageConfig.badgeText}`}>
                {stageConfig.label}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2E5C85] tracking-tight">{loan.client_name}</h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onEdit(loan)}
              className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Application</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(loan)}
              className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stage Progression Bar & Update Stage Action */}
        <div className="px-6 py-5 bg-white border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B889] flex items-center gap-1.5">
              <Layers size={14} />
              <span>Pipeline Stage Progression</span>
            </span>
            {nextStage && (
              <button
                type="button"
                onClick={() => handleUpdateStageClick(nextStage.code)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm hover:shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
              >
                <span>Advance to {nextStage.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {availableStages.map((s, idx) => {
              const isActive = s.code === loan.stage;
              const isPassed = idx < currentIndex;
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => handleUpdateStageClick(s.code)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    isActive
                      ? 'bg-[#10B889] border-[#10B889] text-white shadow-md ring-2 ring-[#10B889]/30'
                      : isPassed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 font-bold'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold tracking-wider uppercase ${isActive ? 'text-emerald-100' : isPassed ? 'text-emerald-800' : 'text-gray-400'}`}>
                      Stage {idx + 1}
                    </span>
                    {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className={`text-xs font-bold mt-1 truncate ${isActive ? 'text-white' : ''}`}>
                    {s.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Transaction Type</div>
              <div className="text-sm font-bold text-gray-900 mt-1">{loan.transaction_type || '—'}</div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loan Type & Term</div>
              <div className="text-sm font-bold text-gray-900 mt-1">
                {loan.loan_type || '—'} • {loan.loan_term || '—'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Est. Property Value</div>
              <div className="text-sm font-bold text-emerald-700 mt-1">
                {loan.estimated_property_value
                  ? `$${loan.estimated_property_value.toLocaleString()}`
                  : '—'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Est. Credit Score</div>
              <div className="text-sm font-bold text-blue-700 mt-1">
                {loan.estimated_credit_score || '—'}
              </div>
            </div>
          </div>

          {/* Borrower Contact Info */}
          <div className="p-5 rounded-xl bg-gray-50/80 border border-gray-200 space-y-3.5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-[#10B889] flex items-center gap-1.5">
              <UserCheck size={15} />
              <span>Borrower Contact Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                <div className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 shrink-0 shadow-2xs">
                  <Phone className="w-4 h-4" />
                </div>
                <span>{loan.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                <div className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 shrink-0 shadow-2xs">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="truncate">{loan.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                <div className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 shrink-0 shadow-2xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>{loan.address ? `${loan.address}, ${loan.state}` : loan.state}</span>
              </div>
            </div>
          </div>

          {/* Assigned Staff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Assigned Loan Officer</div>
              <div className="text-sm font-bold text-gray-900 mt-1">{loan.loan_officer_name || '—'}</div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200 shadow-sm">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Assigned Processor</div>
              <div className="text-sm font-bold text-gray-900 mt-1">{loan.processor_name || 'Unassigned'}</div>
            </div>
          </div>

          {/* Missing Docs Box if N */}
          {loan.all_documents_received === 'N' && loan.missing_documents_list && (
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 shadow-sm">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
                Missing Documents Checklist
              </div>
              <p className="text-sm font-medium text-amber-900 whitespace-pre-wrap">{loan.missing_documents_list}</p>
            </div>
          )}

          {/* Additional Notes */}
          {loan.additional_notes && (
            <div className="p-5 rounded-xl bg-gray-50/80 border border-gray-200 shadow-sm">
              <div className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                Additional Notes
              </div>
              <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">{loan.additional_notes}</p>
            </div>
          )}

          {/* Stage Transition History */}
          <StageHistorySection loanId={loan.id} currentStage={loan.stage} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 text-xs sm:text-sm"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
