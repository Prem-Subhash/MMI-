'use client';

import React from 'react';
import { X, Layers, FileCheck, ArrowRight, Building2 } from 'lucide-react';
import { PipelineType } from '@/app/mortgage/lib/types';

interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPipeline: (pipelineType: PipelineType) => void;
}

export default function CreateApplicationModal({
  isOpen,
  onClose,
  onSelectPipeline,
}: CreateApplicationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg space-y-4 shadow-2xl border border-gray-100 my-auto relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b pb-4">
              <div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                  Mortgage Pipeline Intake
                </span>
                <h2 className="text-xl font-bold text-[#2E5C85]">
                  Create Mortgage Application
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select the lending workflow pipeline for this new borrower intake
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selection Cards */}
            <div className="space-y-4 pt-2">
              {/* Card 1: New Loan Pipeline */}
              <div
                onClick={() => onSelectPipeline('NEW_LOAN')}
                className="group cursor-pointer rounded-2xl p-6 flex items-start gap-4 shadow-md transition-all duration-300 bg-white text-gray-800 hover:bg-[#2E5C85] hover:text-white border-2 border-[#2E5C85] hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-white/20 transition-colors text-[#10B889] group-hover:text-white flex-shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold">New Loan Pipeline</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 group-hover:bg-white/20 group-hover:text-white text-[10px] font-bold border border-emerald-200 group-hover:border-white/30">
                      6 Stages
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 group-hover:text-white/90 mt-1 leading-relaxed">
                    Full origination pipeline starting at NEW LOAN stage and progressing through Underwriting, Compliance, Closing & Audit.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#10B889] group-hover:text-emerald-300 pt-2 border-t border-gray-100 group-hover:border-white/10">
                    <span>Start New Loan Form</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 2: Pre-Approval Pipeline */}
              <div
                onClick={() => onSelectPipeline('PRE_APPROVAL')}
                className="group cursor-pointer rounded-2xl p-6 flex items-start gap-4 shadow-md transition-all duration-300 bg-white text-gray-800 hover:bg-[#2E5C85] hover:text-white border-2 border-[#2E5C85] hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-white/20 transition-colors text-[#2E5C85] group-hover:text-white flex-shrink-0">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold">Pre-Approval Pipeline</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 group-hover:bg-white/20 group-hover:text-white text-[10px] font-bold border border-blue-200 group-hover:border-white/30">
                      2 Stages
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 group-hover:text-white/90 mt-1 leading-relaxed">
                    Borrower pre-qualification workflow starting at PRE-APPROVAL stage and progressing through Manual Underwriting.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#2E5C85] group-hover:text-blue-200 pt-2 border-t border-gray-100 group-hover:border-white/10">
                    <span>Start Pre-Approval Form</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
