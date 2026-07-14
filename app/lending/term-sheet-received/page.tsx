'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, GitBranch } from 'lucide-react'
import TermSheetReceivedStageUI from '@/components/lending/TermSheetReceivedStageUI'

export default function StandaloneTermSheetReceivedPage() {
  const router = useRouter()

  return (
    <div className="w-full space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/lending/pipeline')}
            className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft size={16} />
            <span>Back to Kanban Board</span>
          </button>
          <div className="h-6 w-px bg-gray-200 hidden sm:block" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#10B889]">
            <GitBranch size={16} />
            <span>Accurate Lending Pipeline • Milestone 5</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/lending/loans')}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl transition-all"
        >
          View All Loans Directory
        </button>
      </div>

      {/* Main Term Sheet Received Stage UI Component */}
      <TermSheetReceivedStageUI
        loanId="AL-1004"
        borrowerName="Apex Logistics LLC"
        loanAmount="$1,450,000"
        loanType="SBA 7a"
        onClose={() => router.push('/lending/pipeline')}
      />
    </div>
  )
}
