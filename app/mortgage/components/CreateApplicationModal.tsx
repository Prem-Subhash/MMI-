'use client';

import React from 'react';
import { X, Layers, FileCheck, ArrowRight } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Create Mortgage Application
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select the lending workflow pipeline for this new borrower intake
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Interactive Cards Selection */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Card 1: New Loan Pipeline */}
          <div
            onClick={() => onSelectPipeline('NEW_LOAN')}
            className="p-6 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  New Loan
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                  6 Stages
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Full origination pipeline starting at <span className="text-blue-300 font-semibold">NEW LOAN</span> stage and progressing through Underwriting, Compliance, Closing & Audit.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-blue-400">
              <span>Start New Loan Form</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Pre-Approval Pipeline */}
          <div
            onClick={() => onSelectPipeline('PRE_APPROVAL')}
            className="p-6 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border-2 border-slate-700/80 hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between group shadow-lg"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                  Pre-Approval
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                  2 Stages
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Borrower pre-qualification workflow starting at <span className="text-indigo-300 font-semibold">PRE-APPROVAL</span> stage and progressing through Manual Underwriting.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-indigo-400">
              <span>Start Pre-Approval Form</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>

        <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
