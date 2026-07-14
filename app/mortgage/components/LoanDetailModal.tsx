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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stageConfig.badgeBg} ${stageConfig.badgeText}`}>
                {stageConfig.label}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {loan.pipeline_type === 'NEW_LOAN' ? 'New Loan Pipeline (6 Stages)' : 'Pre-Approval Pipeline (2 Stages)'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{loan.client_name}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(loan)}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Stage Fields</span>
            </button>

            <button
              onClick={() => onDelete(loan)}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stage Progression Bar & Update Stage Action */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pipeline Stage Progression
            </span>
            {nextStage && (
              <button
                onClick={() => handleUpdateStageClick(nextStage.code)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
              >
                <span>Update Stage: Advance to {nextStage.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {availableStages.map((s, idx) => {
              const isActive = s.code === loan.stage;
              const isPassed = idx < currentIndex;
              return (
                <button
                  key={s.code}
                  onClick={() => handleUpdateStageClick(s.code)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                      : isPassed
                      ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-wide uppercase">
                      Stage {idx + 1}
                    </span>
                    {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className={`text-xs font-bold mt-1 ${isActive ? 'text-blue-400' : ''}`}>
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
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Transaction Type</div>
              <div className="text-sm font-bold text-white mt-1">{loan.transaction_type || '—'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Loan Type & Term</div>
              <div className="text-sm font-bold text-white mt-1">
                {loan.loan_type || '—'} • {loan.loan_term || '—'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Est. Property Value</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {loan.estimated_property_value
                  ? `$${loan.estimated_property_value.toLocaleString()}`
                  : '—'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Est. Credit Score</div>
              <div className="text-sm font-bold text-blue-400 mt-1">
                {loan.estimated_credit_score || '—'}
              </div>
            </div>
          </div>

          {/* Borrower Contact Info */}
          <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Borrower Contact Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{loan.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{loan.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{loan.address ? `${loan.address}, ${loan.state}` : loan.state}</span>
              </div>
            </div>
          </div>

          {/* Assigned Staff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Assigned Loan Officer</div>
              <div className="text-sm font-bold text-white mt-1">{loan.loan_officer_name || '—'}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Assigned Processor</div>
              <div className="text-sm font-bold text-white mt-1">{loan.processor_name || 'Unassigned'}</div>
            </div>
          </div>

          {/* Missing Docs Box if N */}
          {loan.all_documents_received === 'N' && loan.missing_documents_list && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                Missing Documents Checklist
              </div>
              <p className="text-sm text-amber-200 whitespace-pre-wrap">{loan.missing_documents_list}</p>
            </div>
          )}

          {/* Additional Notes */}
          {loan.additional_notes && (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Additional Notes
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{loan.additional_notes}</p>
            </div>
          )}

          {/* Stage Transition History */}
          <StageHistorySection loanId={loan.id} currentStage={loan.stage} />
        </div>
      </div>
    </div>
  );
}
