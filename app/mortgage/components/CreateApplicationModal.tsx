'use client';

import React from 'react';
import { X, Layers, FileCheck, ArrowRight, Building2 } from 'lucide-react';
import { PipelineType } from '@/app/mortgage/lib/types';
import { toast } from '@/lib/toast';
import { Modal } from '@/components/ui/Modal';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Mortgage Application"
      subtitle="Select the lending workflow pipeline for this new borrower intake"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
              {/* Card 1: New Loan Pipeline */}
              <div
                onClick={() => {
                  toast('Starting New Loan Application intake...', 'info', 2000);
                  onSelectPipeline('NEW_LOAN');
                }}
                className="group cursor-pointer rounded-2xl p-6 flex items-start gap-4 shadow-md transition-all duration-300 bg-white text-gray-800 hover:bg-[#2E5C85] hover:text-white border-2 border-[#2E5C85] hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-white/20 transition-colors text-[#10B889] group-hover:text-white flex-shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold">New Loan Pipeline</h3>
    
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
                onClick={() => {
                  toast('Starting Pre-Approval Application intake...', 'info', 2000);
                  onSelectPipeline('PRE_APPROVAL');
                }}
                className="group cursor-pointer rounded-2xl p-6 flex items-start gap-4 shadow-md transition-all duration-300 bg-white text-gray-800 hover:bg-[#2E5C85] hover:text-white border-2 border-[#2E5C85] hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-white/20 transition-colors text-[#2E5C85] group-hover:text-white flex-shrink-0">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold">Pre-Approval Pipeline</h3>

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

      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 h-[46px]"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
