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
  ArrowLeft,
  Zap,
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
  isHidden?: boolean;
  onViewHistory?: () => void;
}

export default function LoanDetailModal({
  isOpen,
  loan,
  onClose,
  onEdit,
  onEditStage,
  onDelete,
  onMoveStage,
  isHidden,
  onViewHistory,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true" style={{ display: isHidden ? "none" : "flex" }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {loan.client_name || 'Mortgage Application Details'}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Review mortgage information and pipeline status
            </p>
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

          {/* Mortgage Details Grid */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <DollarSign size={14} />
              Mortgage Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Transaction Type</div>
                <div className="text-sm font-bold text-gray-900">{loan.transaction_type || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Loan Type & Term</div>
                <div className="text-sm font-bold text-gray-900">{loan.loan_type || '—'} / {loan.loan_term || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Property Value</div>
                <div className="text-sm font-bold text-emerald-700">
                  {loan.estimated_property_value ? `$${loan.estimated_property_value.toLocaleString()}` : '—'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Est. Credit Score</div>
                <div className="text-sm font-bold text-blue-700">{loan.estimated_credit_score || '—'}</div>
              </div>
            </div>
          </div>

        {/* Borrower Contact Grid */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
            <UserCheck size={14} />
            Borrower Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 shrink-0">
                <Phone size={14} />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Phone</div>
                <div className="text-sm font-medium text-gray-900">{loan.phone || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 shrink-0">
                <Mail size={14} />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Email</div>
                <div className="text-sm font-medium text-gray-900 truncate">{loan.email || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-500 shrink-0">
                <MapPin size={14} />
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Location</div>
                <div className="text-sm font-medium text-gray-900">{loan.address ? `${loan.address}, ${loan.state}` : (loan.state || '—')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline & Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <Calendar size={14} />
              Key Dates & Commission
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">App Received</div>
                <div className="text-sm font-bold text-gray-900">
                  {loan.application_received === 'Y' ? 'Yes' : 'No'}
                  {loan.application_received === 'Y' && loan.application_received_date ? ` (${loan.application_received_date})` : ''}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Target Closing</div>
                <div className="text-sm font-bold text-gray-900">{loan.target_closing_date || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Follow Up Date</div>
                <div className="text-sm font-bold text-amber-600">{loan.follow_up_date || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Expected Commission</div>
                <div className="text-sm font-bold text-emerald-700">
                  {loan.expected_commission ? `$${loan.expected_commission.toLocaleString()}` : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <UserCheck size={14} />
              Staff Assignment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Assigned Loan Officer</div>
                <div className="text-sm font-bold text-gray-900">{loan.loan_officer_name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Assigned Processor</div>
                <div className="text-sm font-bold text-gray-900">{loan.processor_name || 'Unassigned'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Docs Box if N */}
        {loan.all_documents_received === 'N' && loan.missing_documents_list && (
          <div className="mb-6 bg-amber-50 rounded-2xl border-2 border-amber-200 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-2">
              <CheckCircle2 size={13} />
              Missing Documents Checklist
            </h3>
            <p className="text-sm text-amber-900 whitespace-pre-wrap font-medium leading-relaxed">{loan.missing_documents_list}</p>
          </div>
        )}

        {/* Additional Notes */}
        {loan.additional_notes && (
          <div className="mb-6 bg-slate-100 rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-black mb-2 flex items-center gap-2">
              <Layers size={13} />
              Additional Notes
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{loan.additional_notes}</p>
          </div>
        )}

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
    </div >
  );
}
