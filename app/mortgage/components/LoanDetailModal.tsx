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

/** Colour-coded badge for pipeline stage names */
function StageBadge({ stage, config }: { stage?: string | null, config?: any }) {
  if (!stage && !config) return <span className="text-gray-400 text-sm">—</span>;
  const cls = config ? `${config.badgeBg} ${config.badgeText}` : 'bg-gray-100 text-gray-600 border-gray-200';
  const label = config ? config.label : stage;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${cls}`}>
      {label}
    </span>
  );
}

/** Reusable KPI card – light border + accent */
function KpiCard({
  icon,
  label,
  children,
  accent = 'from-gray-200 to-gray-300',
  glow = 'shadow-gray-200/50',
  iconBg = 'bg-gray-50 text-gray-400',
  hoverIconBg = 'group-hover/card:bg-gray-100 group-hover/card:text-gray-600'
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  accent?: string;
  glow?: string;
  iconBg?: string;
  hoverIconBg?: string;
}) {
  return (
    <div className={`
      relative bg-white rounded-2xl border border-gray-100 p-5
      shadow-sm hover:shadow-lg active:shadow-lg ${glow}
      hover:-translate-y-1 active:-translate-y-1
      hover:border-transparent active:border-transparent
      transition-all duration-300 overflow-hidden h-full flex flex-col gap-1.5 group/card
    `}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent}
          transform scale-x-0 group-hover/card:scale-x-100 group-active/card:scale-x-100
          transition-transform duration-300 origin-left rounded-t-2xl`}
      />
      <div className="flex items-center gap-2">
        <div className={`
            p-2 rounded-lg ${iconBg} ${hoverIconBg}
            transition-all duration-300 inline-flex
            group-hover/card:scale-110 group-active/card:scale-110
        `}>
          {icon}
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider leading-none text-gray-400 group-hover/card:text-gray-600 transition-colors">
          {label}
        </p>
      </div>
      <div className="pl-0.5 pt-1">{children}</div>
    </div>
  );
}

/* ── inline SVG icons ─────────── */
const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconFile = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconZap = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
import { toast } from '@/lib/toast';
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
    const targetStageName = getStageConfig(targetCode).label;
    toast(`Opening stage update form for "${targetStageName}"...`, 'info', 2000);
    if (onEditStage) {
      onEditStage(loan, targetCode);
    } else {
      onEdit({ ...loan, stage: targetCode });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true" style={{ display: isHidden ? "none" : "flex" }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
        {/* Header */}
        <div className="shrink-0 p-6 bg-slate-50 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {loan.client_name || 'Mortgage Application Details'}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Review mortgage information and pipeline status
            </p>
          </div>
          <button
            onClick={() => onEdit(loan)}
            className="flex items-center justify-center gap-2 bg-[#D16B4B] hover:opacity-90 text-white px-4 py-2 rounded-xl transition-all text-sm font-bold shadow-md"
          >
            <Edit3 size={16} />
            Edit Application Info
          </button>
        </div>

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
          
          {/* 1. INFO GRID LAYOUT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <KpiCard 
              icon={<IconUser />} 
              label="Borrower Name"
              accent="from-[#10B889] to-[#0d9470]"
              glow="shadow-emerald-200/60"
              iconBg="bg-emerald-50 text-emerald-600"
              hoverIconBg="group-hover/card:bg-[#10B889] group-hover/card:text-white"
            >
              <p className="text-base font-bold text-gray-800 break-words">{loan.client_name || '—'}</p>
            </KpiCard>
            
            <KpiCard 
              icon={<IconMail />} 
              label="Email Address"
              accent="from-[#2E5C85] to-[#1e3f5e]"
              glow="shadow-blue-200/60"
              iconBg="bg-blue-50 text-blue-600"
              hoverIconBg="group-hover/card:bg-[#2E5C85] group-hover/card:text-white"
            >
              <p className="text-base font-bold text-gray-800 break-all">{loan.email || '—'}</p>
            </KpiCard>

            <KpiCard 
              icon={<IconFile />} 
              label="Pipeline Type"
              accent="from-amber-500 to-orange-500"
              glow="shadow-amber-200/60"
              iconBg="bg-amber-50 text-amber-600"
              hoverIconBg="group-hover/card:bg-amber-500 group-hover/card:text-white"
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto self-end sm:self-center">
            <button
              type="button"
              onClick={() => onEdit(loan)}
              className="h-10 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 flex-1 sm:flex-initial"
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span>Edit Application</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(loan)}
              className="h-10 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 flex-1 sm:flex-initial"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 shrink-0"
              aria-label="Close modal"
            >
              <p className="text-base font-bold text-gray-800 break-words">
                {loan.pipeline_type === 'NEW_LOAN' ? 'New Loan Pipeline' : 'Pre-Approval Pipeline'}
              </p>
            </KpiCard>

            <KpiCard 
              icon={<IconZap />} 
              label="Current Status"
              accent="from-purple-600 to-indigo-600"
              glow="shadow-purple-200/60"
              iconBg="bg-purple-50 text-purple-600"
              hoverIconBg="group-hover/card:bg-purple-600 group-hover/card:text-white"
            >
              <StageBadge stage={loan.stage} config={stageConfig} />
            </KpiCard>
          </div>

          {/* 2. MORTGAGE DETAILS GROUPS */}
          <div className="space-y-6">
            
            {/* Loan Details Grid */}
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
        {/* Stage Progression Bar & Update Stage Action */}
        <div className="shrink-0 px-6 py-5 bg-white border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#10B889] flex items-center gap-1.5">
              <Layers size={14} />
              <span>Pipeline Stage Progression</span>
            </span>
            {nextStage && (
              <button
                type="button"
                onClick={() => handleUpdateStageClick(nextStage.code)}
                className="h-10 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto"
              >
                <span>Advance to {nextStage.label}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
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
                  className={`h-full flex flex-col justify-between p-3 rounded-xl text-left border transition-all ${
                    isActive
                      ? 'bg-[#10B889] border-[#10B889] text-white shadow-md ring-2 ring-[#10B889]/30'
                      : isPassed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100 font-bold'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-bold tracking-wider uppercase ${isActive ? 'text-emerald-100' : isPassed ? 'text-emerald-800' : 'text-gray-400'}`}>
                      Stage {idx + 1}
                    </span>
                    {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className={`text-xs font-bold mt-1.5 truncate w-full ${isActive ? 'text-white' : ''}`}>
                    {s.label}
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

          {/* 3. BUTTON GROUP ORGANIZATION */}
          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-wrap items-center justify-start gap-3 w-full">
            {onViewHistory && (
              <button
                onClick={onViewHistory}
                className="px-5 py-2.5 bg-brand-dark text-white hover:bg-brand-dark/90 rounded-lg shadow-sm transition flex items-center justify-center gap-2 font-bold whitespace-nowrap"
              >
                View History
              </button>
            )}
            <button
              onClick={() => onEdit(loan)}
              className="px-5 py-2.5 bg-[#2E5C85] hover:bg-[#234b6e] text-white rounded-lg shadow-sm transition flex items-center justify-center gap-2 font-bold whitespace-nowrap"
            >
              Update Stage
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#475569] hover:bg-[#334155] text-white rounded-lg shadow-sm transition flex items-center justify-center gap-2 font-bold whitespace-nowrap group"
            >
              <ArrowLeft size={16} className="shrink-0 text-slate-200 group-hover:text-white transition-colors" />
              <span>Back</span>
            </button>
          </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4 sm:px-8 flex items-center justify-end gap-3 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="h-10 min-w-[120px] px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all active:scale-95 text-xs sm:text-sm flex items-center justify-center shadow-2xs"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
