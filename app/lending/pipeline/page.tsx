'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  PlusCircle,
  Building2,
  ArrowUpRight,
  X,
  Landmark,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Pencil
} from 'lucide-react'
import { LENDING_STAGES } from '@/app/lending/lib/constants'
import { toast } from '@/lib/toast'
import UpdateStageModal from '@/components/lending/UpdateStageModal'
import StageHistoryModal from '@/components/lending/StageHistoryModal'

export default function LendingKanbanPipelinePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN')
  const [stageFilter, setStageFilter] = useState<string | null>(null)
  
  
  const [loans, setLoans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Interactive modal state
  const [activeModalCard, setActiveModalCard] = useState<any | null>(null)
  const [historyLoan, setHistoryLoan] = useState<any | null>(null)

  const fetchLoans = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/lending/loans?limit=500')
      const json = await res.json()
      if (json.success) {
        setLoans(json.loans || [])
      } else {
        throw new Error(json.error)
      }
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const filteredLoans = loans.filter(loan => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (loan.borrower_name || '').toLowerCase().includes(term) ||
      (loan.loan_type || '').toLowerCase().includes(term) ||
      (loan.nature_of_loan || '').toLowerCase().includes(term) ||
      loan.id.toLowerCase().includes(term)

    const matchesType = selectedType === 'ALL' || loan.loan_type === selectedType
    const matchesStage = !stageFilter || loan.current_stage === stageFilter
    
    return matchesSearch && matchesType && matchesStage
  })



  return (
    <div className="w-full h-full flex flex-col space-y-4 animate-fade-in pb-12">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white p-4 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">
            <Building2 size={14} />
            <span>21-Stage Commercial Lending Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Accurate Lending Pipeline Management
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-0.5">
            Manage all 21 underwriting milestones. Switch between Kanban and List views to monitor files.
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

      {/* Filter & View Toolbar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
            <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
                type="text"
                placeholder="Search borrower, ID..."
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
            <select 
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-gray-100 text-gray-700 border border-gray-200"
            >
                <option value="ALL">All Types</option>
                <option value="SBA 7a">SBA 7a</option>
                <option value="SBA 504">SBA 504</option>
                <option value="Conventional">Conventional</option>
                <option value="Bridge Loan">Bridge Loan</option>
                <option value="Private Loan">Private Loan</option>
                <option value="Equipment Financing">Equipment Financing</option>
            </select>
            </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl shrink-0">
            <button
               onClick={() => setViewMode('KANBAN')}
               className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'KANBAN' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
               <LayoutGrid size={14} /> KANBAN
            </button>
            <button
               onClick={() => setViewMode('LIST')}
               className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'LIST' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
               <ListIcon size={14} /> LIST
            </button>
        </div>
      </div>

      {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading pipeline data...</div>
      ) : (
          <>
          {viewMode === 'KANBAN' ? (
              /* KANBAN VIEW */
            <div className="bg-slate-200/60 border border-gray-300/80 rounded-2xl p-4 sm:p-6 overflow-x-auto shadow-inner min-h-[560px] flex-1">
                <div className="inline-flex items-start gap-4 pb-4">
                {LENDING_STAGES.map((stageName, index) => {
                    const stageNumber = index + 1
                    const cardsInStage = filteredLoans.filter(c => c.current_stage === stageName)
                    const isTermSheetStage = stageNumber === 5 // Term Sheet Received

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
                            {stageNumber}
                            </span>
                            <h3 className="font-bold text-[10px] uppercase tracking-wider break-words" title={stageName}>
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
                            onClick={() => setActiveModalCard(card)}
                            className={`bg-white p-4 rounded-xl border shadow-xs hover:shadow-lg transition-all cursor-pointer group/card relative overflow-hidden ${
                                isTermSheetStage ? 'border-emerald-300 hover:border-[#10B889]' : 'border-gray-200/90 hover:border-brand-dark'
                            }`}
                            >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                                {card.id.split('-').pop()}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-gray-100 px-2 py-0.5 rounded uppercase">
                                {card.loan_type}
                                </span>
                            </div>

                            <h4 className="font-extrabold text-slate-900 text-sm group-hover/card:text-brand-dark transition-colors leading-tight break-words">
                                {card.borrower_name}
                            </h4>

                            <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                                <div className="flex justify-between items-start gap-2">
                                <span className="text-slate-400 font-medium shrink-0">Purpose:</span>
                                <span className="font-semibold text-slate-700 break-words text-right">{card.loan_purpose}</span>
                                </div>
                                <div className="flex justify-between items-start gap-2">
                                <span className="text-slate-400 font-medium shrink-0">Nature:</span>
                                <span className="font-semibold text-slate-700 break-words text-right">{card.nature_of_loan}</span>
                                </div>
                            </div>

                            {/* Prominent Multi-Bank Upload Action for Stage 5 */}
                            {isTermSheetStage && (
                                <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveModalCard(card)
                                }}
                                className="w-full mt-3 py-2 px-3 bg-gradient-to-r from-[#10B889] to-[#2E5C85] hover:opacity-95 text-white font-extrabold text-[10px] uppercase rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                                >
                                <Landmark size={12} />
                                <span>Manage Term Sheets</span>
                                </button>
                            )}

                            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                                <div>
                                <p className="text-[9px] uppercase font-bold text-slate-400">Loan Amount</p>
                                <p className="font-extrabold text-slate-900 text-xs">
                                    {card.purchase_price ? `$${Number(card.purchase_price).toLocaleString()}` : '—'}
                                </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setHistoryLoan(card) }}
                                    className="text-gray-400 hover:text-brand-dark transition-colors p-1"
                                    title="View History"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <span className="text-[10px] font-bold text-brand-dark group-hover/card:underline uppercase flex items-center gap-0.5">
                                    <span>Stage</span>
                                    <ArrowUpRight size={10} />
                                  </span>
                                </div>
                            </div>
                            </div>
                        ))}

                        {cardsInStage.length === 0 && (
                            <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-2 text-center text-gray-400 bg-white/40">
                            <span className="text-[10px] mt-0.5 text-gray-400">Empty Stage</span>
                            </div>
                        )}
                        </div>
                    </div>
                    )
                })}
                </div>
            </div>
          ) : (
            /* ==============================================================
               PIPELINE / LIST VIEW (Matching CSR Style)
               ============================================================== */
            <div className="flex-1 flex flex-col gap-5">
                {/* FILTER TABS */}
                <div className="flex gap-2 flex-wrap bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0">
                    <button
                        onClick={() => setStageFilter(null)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors touch-manipulation
                        ${!stageFilter
                            ? 'bg-brand text-white border-brand shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                        }`}
                    >
                        All Stages
                    </button>
                    {LENDING_STAGES.map(stage => {
                        const isActive = stage === stageFilter
                        return (
                            <button
                                key={stage}
                                onClick={() => setStageFilter(stage)}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors touch-manipulation
                                ${isActive
                                    ? 'bg-brand text-white border-brand shadow-sm'
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                }`}
                            >
                                {stage.replace(/^\d+\.\s*/, '')}
                            </button>
                        )
                    })}
                </div>

                {/* LIST / TABLE SECTION */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="text-sm text-gray-500 font-medium whitespace-nowrap">
                            {filteredLoans.length} Loan{filteredLoans.length !== 1 && 's'} Found in {stageFilter ? stageFilter.replace(/^\d+\.\s*/, '') : 'All Stages'}
                        </div>
                    </div>

                    {filteredLoans.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No applications match the current filter.
                        </div>
                    ) : (
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left table-fixed" style={{ minWidth: '1380px' }}>
                                <colgroup>
                                    <col style={{ width: '220px' }} />
                                    <col style={{ width: '130px' }} />
                                    <col style={{ width: '220px' }} />
                                    <col style={{ width: '250px' }} />
                                    <col style={{ width: '220px' }} />
                                    <col style={{ width: '110px' }} />
                                    <col style={{ width: '150px' }} />
                                </colgroup>
                                <thead className="text-white uppercase text-xs border-b border-gray-100 tracking-wider">
                                    <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85]">
                                        <th className="px-4 py-4 font-semibold">Borrower Name</th>
                                        <th className="px-4 py-4 font-semibold">Loan ID</th>
                                        <th className="px-4 py-4 font-semibold">Loan Type</th>
                                        <th className="px-4 py-4 font-semibold">Amount</th>
                                        <th className="px-4 py-4 font-semibold">Stage</th>
                                        <th className="px-4 py-4 font-semibold text-center">Created</th>
                                        <th className="px-4 py-4 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredLoans.map(loan => {
                                        const loanIdShort = loan.id ? loan.id.split('-').pop() : ''
                                        
                                        return (
                                        <tr key={loan.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-4 py-4 font-medium text-gray-900 break-words align-top">
                                                {loan.borrower_name || '—'}
                                            </td>
                                            <td className="px-4 py-4 align-top font-mono text-xs text-gray-500 uppercase">
                                                {loanIdShort}
                                            </td>
                                            <td className="px-4 py-4 text-gray-700 font-semibold break-words align-top uppercase">
                                                {loan.loan_type || 'COMMERCIAL'}
                                            </td>
                                            <td className="px-4 py-4 font-bold text-emerald-700 align-top">
                                                {loan.purchase_price ? `$${Number(loan.purchase_price).toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-4 py-4 align-top">
                                                <span className="bg-gray-100 border border-gray-200 text-gray-800 text-[10px] font-bold px-2 py-1 rounded-md uppercase whitespace-nowrap">
                                                    {loan.current_stage || LENDING_STAGES[0]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-gray-500 whitespace-nowrap text-center align-top">
                                                {loan.created_at ? new Date(loan.created_at).toLocaleDateString() : '—'}
                                            </td>
                                            
                                            {/* ACTIONS */}
                                            <td className="px-4 py-4 text-center align-top space-x-2">
                                                <button
                                                    onClick={() => router.push(`/lending/loans/${loan.id}`)}
                                                    className="text-brand hover:text-brand-dark transition-colors p-1.5 rounded-md hover:bg-gray-100 inline-flex items-center justify-center border border-gray-200 shadow-sm"
                                                    title="View Loan Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setHistoryLoan(loan)}
                                                    className="text-indigo-600 hover:text-indigo-800 transition-colors p-1.5 rounded-md hover:bg-indigo-50 inline-flex items-center justify-center border border-indigo-200 shadow-sm"
                                                    title="View Stage History"
                                                >
                                                    <ListIcon size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setActiveModalCard(loan)}
                                                    className="text-amber-600 hover:text-amber-800 transition-colors p-1.5 rounded-md hover:bg-amber-50 inline-flex items-center justify-center border border-amber-200 shadow-sm"
                                                    title="Update Pipeline Stage"
                                                >
                                                    <ArrowUpRight size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
          )}
          </>
      )}

      {/* STAGE WORKFLOW & TERM SHEET RECEIVED MODAL */}
      {activeModalCard && (
        <UpdateStageModal
          loan={activeModalCard}
          onClose={() => setActiveModalCard(null)}
          onSuccess={() => {
            setActiveModalCard(null)
            fetchLoans()
          }}
        />
      )}

      {/* HISTORY MODAL */}
      {historyLoan && (
        <StageHistoryModal
          loanId={historyLoan.id}
          borrowerName={historyLoan.borrower_name}
          onClose={() => setHistoryLoan(null)}
        />
      )}
    </div>
  )
}
