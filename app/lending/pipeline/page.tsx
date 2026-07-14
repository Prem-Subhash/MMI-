'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  PlusCircle,
  Building2,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  X,
  FileText,
  CheckCircle2,
  Landmark,
  ChevronDown
} from 'lucide-react'
import TermSheetReceivedStageUI from '@/components/lending/TermSheetReceivedStageUI'
import { toast } from '@/lib/toast'

const LENDING_STAGES = [
  '1. New Loan',
  '2. Initial Email Sent / Documents Requested',
  '3. Initial Screening',
  '4. Under Review by Lender',
  '5. Term Sheet Received',
  '6. Which Lender is Providing Loan?',
  '7. Good Faith Deposit Received',
  '8. Accutax – Received (Amount)',
  '9. Accurate Lending – Received (Amount)',
  '10. Lender Bank – Received (Amount)',
  '11. UW Document – Requested',
  '12. Which Documents were Requested? (Notes)',
  '13. UW Document – Received',
  '14. UW',
  '15. Closing Checklist – Received',
  '16. Closing Checklist – In Process',
  '17. Closing Checklist – Completed',
  '18. Loan Closed',
  '19. Documents Saved?',
  '20. Check Received from the Bank',
  '21. Check Received from Borrower (if applicable)'
]

interface LoanCard {
  id: string
  borrower: string
  type: string
  purpose: string
  nature: string
  amount: string
  downPayment: string
  lender: string
  stageIndex: number
  date: string
}

const STATIC_LOAN_CARDS: LoanCard[] = [
  {
    id: 'AL-1001',
    borrower: 'GreenLeaf Dispensary Co',
    type: 'Private Loan',
    purpose: 'Start-up',
    nature: 'Cannabis Dispensary',
    amount: '$650,000',
    downPayment: '30%',
    lender: 'Celtic Bank',
    stageIndex: 0, // 1. New Loan
    date: '2026-07-04'
  },
  {
    id: 'AL-1002',
    borrower: 'Metro Grocery Store LLC',
    type: 'SBA 7a',
    purpose: 'Acquisition',
    nature: 'Grocery Store',
    amount: '$1,100,000',
    downPayment: '20%',
    lender: 'Center Stone SBA Lending',
    stageIndex: 1, // 2. Initial Email Sent
    date: '2026-07-03'
  },
  {
    id: 'AL-1003',
    borrower: 'Sunrise Early Education LLC',
    type: 'SBA 7a',
    purpose: 'Acquisition',
    nature: 'Day Care',
    amount: '$920,000',
    downPayment: '20%',
    lender: 'First Financial Bank',
    stageIndex: 2, // 3. Initial Screening
    date: '2026-07-02'
  },
  {
    id: 'AL-1004',
    borrower: 'Apex Logistics LLC',
    type: 'SBA 7a',
    purpose: 'Acquisition',
    nature: 'Gas Station',
    amount: '$1,450,000',
    downPayment: '20%',
    lender: 'American Commercial Bank & Trust',
    stageIndex: 4, // 5. Term Sheet Received
    date: '2026-06-28'
  },
  {
    id: 'AL-1005',
    borrower: 'Midwest Health Partners',
    type: 'Conventional',
    purpose: 'Refinance',
    nature: "Doctor's Office",
    amount: '$850,000',
    downPayment: '20%',
    lender: 'Byline Bank',
    stageIndex: 13, // 14. UW
    date: '2026-06-24'
  },
  {
    id: 'AL-1006',
    borrower: 'Lakeshore Hospitality Inc',
    type: 'SBA 504',
    purpose: 'Construction Loan',
    nature: 'Hotel/Motel - Flagged',
    amount: '$3,200,000',
    downPayment: '20%',
    lender: 'US Bank',
    stageIndex: 15, // 16. Closing Checklist - In Process
    date: '2026-06-18'
  },
  {
    id: 'AL-1007',
    borrower: 'Fresh Market Grocery LLC',
    type: 'Equipment Financing',
    purpose: 'Refinance',
    nature: 'Grocery Store',
    amount: '$410,000',
    downPayment: '20%',
    lender: 'Harvest Bank',
    stageIndex: 17, // 18. Loan Closed
    date: '2026-06-10'
  }
]

export default function LendingKanbanPipelinePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [cards, setCards] = useState<LoanCard[]>(STATIC_LOAN_CARDS)

  // Interactive modal state
  const [activeModalCard, setActiveModalCard] = useState<LoanCard | null>(null)
  const [modalStageIndex, setModalStageIndex] = useState<number>(4)

  const filteredCards = cards.filter(card => {
    const matchesSearch =
      card.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.lender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.nature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === 'ALL' || card.type === selectedType
    return matchesSearch && matchesType
  })

  const openStageModal = (card: LoanCard) => {
    setActiveModalCard(card)
    setModalStageIndex(card.stageIndex)
  }

  const updateCardStage = (cardId: string, newStageIndex: number) => {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, stageIndex: newStageIndex } : c))
    )
    toast(`Stage updated to ${LENDING_STAGES[newStageIndex]}`, 'success')
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4 animate-fade-in">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">
            <Building2 size={14} />
            <span>21-Stage Commercial Lending Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Accurate Lending Kanban Board
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-0.5">
            Horizontal scroll view displaying all 21 underwriting milestones. Click any card to manage stage workflows or multi-bank Term Sheet uploads.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => router.push('/lending/loans/new')}
            className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white font-bold py-2.5 px-5 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider whitespace-nowrap"
          >
            <PlusCircle size={16} />
            <span> New Loan Application</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search borrower, ID, or lender..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mr-1 whitespace-nowrap">
            <Filter size={14} />
            Loan Type:
          </span>
          {['ALL', 'SBA 7a', 'SBA 504', 'Conventional', 'Bridge Loan', 'Private Loan', 'Equipment Financing'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedType === type
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Container (21 Columns with Horizontal Scroll) */}
      <div className="bg-slate-200/60 border border-gray-300/80 rounded-2xl p-4 sm:p-6 overflow-x-auto shadow-inner min-h-[560px] flex-1">
        <div className="inline-flex items-start gap-4 pb-4">
          {LENDING_STAGES.map((stageName, index) => {
            const cardsInStage = filteredCards.filter(c => c.stageIndex === index)
            const isTermSheetStage = index === 4 // 5. Term Sheet Received

            return (
              <div
                key={stageName}
                className={`w-[320px] sm:w-[340px] shrink-0 bg-white/90 backdrop-blur-md rounded-2xl border shadow-sm flex flex-col max-h-[calc(100vh-280px)] overflow-hidden transition-all duration-300 hover:shadow-md group ${
                  isTermSheetStage ? 'border-[#10B889] ring-2 ring-[#10B889]/30' : 'border-gray-200/90 hover:border-blue-300/80'
                }`}
              >
                {/* Column Header */}
                <div className={`p-3.5 text-white rounded-t-2xl flex items-center justify-between border-b border-gray-100 shrink-0 ${
                  isTermSheetStage
                    ? 'bg-gradient-to-r from-[#10B889] via-[#10B889] to-[#2E5C85]'
                    : 'bg-gradient-to-r from-[#10B889] to-[#2E5C85]'
                }`}>
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-6 h-6 rounded-lg bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/30">
                      {index + 1}
                    </span>
                    <h3 className="font-bold text-xs uppercase tracking-wider truncate" title={stageName}>
                      {stageName.replace(/^\d+\.\s*/, '')}
                    </h3>
                  </div>
                  <span className="bg-white text-[#10B889] text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                    {cardsInStage.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1 bg-slate-50/50 min-h-[160px]">
                  {cardsInStage.map(card => (
                    <div
                      key={card.id}
                      onClick={() => openStageModal(card)}
                      className={`bg-white p-4 rounded-xl border shadow-xs hover:shadow-lg transition-all cursor-pointer group/card relative overflow-hidden ${
                        isTermSheetStage ? 'border-emerald-300 hover:border-[#10B889]' : 'border-gray-200/90 hover:border-brand-dark'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                          {card.id}
                        </span>
                        <span className="text-xs font-bold text-slate-500 bg-gray-100 px-2 py-0.5 rounded">
                          {card.type}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm group-hover/card:text-brand-dark transition-colors leading-tight">
                        {card.borrower}
                      </h4>

                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Purpose:</span>
                          <span className="font-semibold text-slate-700">{card.purpose}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Nature:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]">{card.nature}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Lender:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[150px]" title={card.lender}>{card.lender}</span>
                        </div>
                      </div>

                      {/* Prominent Multi-Bank Upload Action for Stage 5 */}
                      {isTermSheetStage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openStageModal(card)
                          }}
                          className="w-full mt-3 py-2 px-3 bg-gradient-to-r from-[#10B889] to-[#2E5C85] hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Landmark size={14} />
                          <span>Multi-Bank Term Sheets</span>
                        </button>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Loan Amount</p>
                          <p className="font-extrabold text-slate-900 text-sm">{card.amount}</p>
                        </div>
                        <span className="text-[10px] font-bold text-brand-dark group-hover/card:underline uppercase flex items-center gap-0.5">
                          <span>Stage Workflow</span>
                          <ArrowUpRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}

                  {cardsInStage.length === 0 && (
                    <div className="h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 text-center text-gray-400 bg-white/40">
                      <p className="text-xs font-semibold">No active loans in stage</p>
                      <span className="text-[10px] mt-0.5 text-gray-400">Awaiting stage transitions</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* STAGE WORKFLOW & TERM SHEET RECEIVED MODAL */}
      {activeModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-5xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B889] mb-1">
                  <span>Accurate Lending Pipeline Stage Manager</span>
                  <span>•</span>
                  <span>{activeModalCard.id}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {activeModalCard.borrower}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative inline-block">
                  <select
                    value={modalStageIndex}
                    onChange={(e) => {
                      const newIdx = Number(e.target.value)
                      setModalStageIndex(newIdx)
                      updateCardStage(activeModalCard.id, newIdx)
                    }}
                    className="appearance-none pl-4 pr-9 py-2 bg-white border-2 border-[#10B889] rounded-xl text-xs font-extrabold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#10B889]"
                  >
                    {LENDING_STAGES.map((s, idx) => (
                      <option key={s} value={idx}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalCard(null)}
                  className="p-2 text-gray-400 hover:text-slate-700 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {modalStageIndex === 4 ? (
                <TermSheetReceivedStageUI
                  loanId={activeModalCard.id}
                  borrowerName={activeModalCard.borrower}
                  loanAmount={activeModalCard.amount}
                  loanType={activeModalCard.type}
                  onClose={() => setActiveModalCard(null)}
                />
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6">
                    <h3 className="text-base font-extrabold text-slate-900 mb-1">
                      Stage: {LENDING_STAGES[modalStageIndex]}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Standard workflow checkpoint for {activeModalCard.borrower}. Select Stage 5 (&quot;Term Sheet Received&quot;) to open the multi-select bank &amp; dynamic document upload manager.
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setModalStageIndex(4)}
                      className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      Switch to Stage 5: Term Sheet Received
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModalCard(null)}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

