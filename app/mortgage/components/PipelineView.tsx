'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  ArrowRightLeft,
  Phone,
  Mail,
  DollarSign,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { MortgageLoan, PipelineType, StageCode } from '@/app/mortgage/lib/types';
import { MORTGAGE_STAGES, getStageConfig } from '@/app/mortgage/lib/stageFields';
import {
  EXCEL_LOAN_OFFICERS,
  EXCEL_PROCESSORS,
  EXCEL_TRANSACTION_TYPES,
} from '@/app/mortgage/lib/excelLookups';
import LoanFormModal from './LoanFormModal';
import LoanDetailModal from './LoanDetailModal';
import StageHistoryModal from './StageHistoryModal';

interface PipelineViewProps {
  pipelineType: PipelineType;
  title: string;
  subtitle: string;
}

export default function PipelineView({ pipelineType, title, subtitle }: PipelineViewProps) {
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [loans, setLoans] = useState<MortgageLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedOfficer, setSelectedOfficer] = useState<string>('ALL');
  const [selectedProcessor, setSelectedProcessor] = useState<string>('ALL');
  const [selectedTxType, setSelectedTxType] = useState<string>('ALL');
  const [selectedLoanType, setSelectedLoanType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Dialog states
  const [selectedCreatePipeline, setSelectedCreatePipeline] = useState<PipelineType>(pipelineType);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<MortgageLoan | null>(null);
  const [editingHistoryRecord, setEditingHistoryRecord] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoanId, setHistoryLoanId] = useState<string | null>(null);
  const [historyLoanStage, setHistoryLoanStage] = useState<any>(null);
  const [detailLoan, setDetailLoan] = useState<MortgageLoan | null>(null);

  const pipelineStages = MORTGAGE_STAGES.filter((s) => s.pipeline === pipelineType);

  // Fetch Loans
  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        pipeline_type: pipelineType,
        page: String(page),
        limit: String(limit),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (selectedStage !== 'ALL') params.append('stage', selectedStage);
      if (selectedOfficer !== 'ALL') params.append('loan_officer_name', selectedOfficer);
      if (selectedProcessor !== 'ALL') params.append('processor_name', selectedProcessor);
      if (selectedTxType !== 'ALL') params.append('transaction_type', selectedTxType);
      if (selectedLoanType !== 'ALL') params.append('loan_type', selectedLoanType);
      if (searchQuery.trim() !== '') params.append('search', searchQuery.trim());

      const res = await fetch(`/api/mortgage/loans?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch loans');
      }

      setLoans(json.loans || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotalRecords(json.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Error loading pipeline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [
    pipelineType,
    page,
    selectedStage,
    selectedOfficer,
    selectedProcessor,
    selectedTxType,
    selectedLoanType,
    sortBy,
    sortOrder,
  ]);

  const handleStageMove = async (loan: MortgageLoan, targetStageCode: StageCode) => {
    try {
      const res = await fetch(`/api/mortgage/loans/${loan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStageCode }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setLoans((prev) =>
          prev.map((l) => (l.id === loan.id ? { ...l, stage: targetStageCode } : l))
        );
        if (detailLoan && detailLoan.id === loan.id) {
          setDetailLoan({ ...detailLoan, stage: targetStageCode });
        }
      }
    } catch (e) {
      console.error('Failed to move stage', e);
    }
  };

  const handleDelete = async (loan: MortgageLoan) => {
    if (!confirm(`Are you sure you want to delete loan application for "${loan.client_name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/mortgage/loans/${loan.id}`, { method: 'DELETE' });
      if (res.ok) {
        setLoans((prev) => prev.filter((l) => l.id !== loan.id));
        if (detailLoan?.id === loan.id) setDetailLoan(null);
      }
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      
      {/* Top Action & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLoans()}
              placeholder="Search by client name, email, phone, officer..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* View Switcher & New Loan Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setViewMode('KANBAN')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'KANBAN'
                    ? 'bg-[#2E5C85] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'TABLE'
                    ? 'bg-[#2E5C85] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedCreatePipeline(pipelineType);
                setEditingLoan(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Application</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs">
          <span className="flex items-center gap-1.5 text-gray-500 font-bold mr-1">
            <Filter className="w-3.5 h-3.5 text-[#10B889]" />
            <span>Filter by Stage:</span>
          </span>

          <div className="relative inline-block">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="appearance-none pr-8 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white text-gray-700 cursor-pointer shadow-sm"
            >
              <option value="ALL">All Stages ({pipelineStages.length})</option>
              {pipelineStages.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="ml-auto flex items-center gap-2 text-gray-500">
            <span className="font-semibold">Sort:</span>
            <div className="relative inline-block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pr-8 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white text-gray-700 cursor-pointer shadow-sm"
              >
                <option value="updated_at">Last Updated</option>
                <option value="created_at">Date Created</option>
                <option value="client_name">Client Name</option>
                <option value="estimated_property_value">Property Value</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 text-gray-700 transition-colors"
            >
              {sortOrder === 'asc' ? 'ASC ↑' : 'DESC ↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-gray-500 gap-3">
            <div className="w-8 h-8 border-2 border-[#10B889] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">Loading Moonstar Mortgage Pipeline...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center shadow-sm">
            <p className="font-semibold">{error}</p>
            <button
              type="button"
              onClick={fetchLoans}
              className="mt-3 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              Retry
            </button>
          </div>
        ) : loans.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-gray-300 rounded-xl shadow-sm">
            <FolderOpen className="w-14 h-14 text-gray-400 mb-3" />
            <h3 className="text-base font-bold text-gray-800">No applications found</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              No applications match your current filters. Click &quot;Create Application&quot; to add a new borrower.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCreatePipeline(pipelineType);
                setEditingLoan(null);
                setIsFormOpen(true);
              }}
              className="mt-5 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Application</span>
            </button>
          </div>
        ) : viewMode === 'KANBAN' ? (
          /* ==============================================================
             KANBAN BOARD VIEW (Matching Innovative Insurance CRM Kanban)
             ============================================================== */
          <div className="bg-slate-100/80 border border-gray-200 rounded-xl p-4 sm:p-6 overflow-x-auto shadow-inner min-h-[560px]">
            <div className="inline-flex items-start gap-4 pb-4">
              {pipelineStages.map((stageItem, idx) => {
                const stageLoans = loans.filter((l) => l.stage === stageItem.code);

                return (
                  <div
                    key={stageItem.code}
                    className="w-[320px] sm:w-[340px] shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col max-h-[calc(100vh-280px)] overflow-hidden transition-all duration-300 hover:shadow-md group"
                  >
                    {/* Column Header */}
                    <div className="p-3.5 bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white rounded-t-xl flex items-center justify-between border-b border-gray-100 shrink-0">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="w-6 h-6 rounded-lg bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/30">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-xs uppercase tracking-wider truncate" title={stageItem.label}>
                          {stageItem.label}
                        </h3>
                      </div>
                      <span className="bg-white text-[#10B889] text-xs font-bold px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                        {stageLoans.length}
                      </span>
                    </div>

                    {/* Cards List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/60 min-h-[160px]">
                      {stageLoans.map((loan) => (
                        <div
                          key={loan.id}
                          className="bg-white p-4 rounded-xl border border-gray-200 hover:border-[#2E5C85] shadow-sm hover:shadow-md transition-all flex flex-col gap-2.5 cursor-pointer group/card relative overflow-hidden"
                          onClick={() => setDetailLoan(loan)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-gray-900 group-hover/card:text-[#2E5C85] transition-colors">
                                {loan.client_name}
                              </h4>
                              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {loan.transaction_type} • {loan.loan_type}
                              </span>
                            </div>

                            <span className="text-xs font-bold text-emerald-600 shrink-0">
                              ${Number(loan.loan_amount || loan.estimated_property_value || 0).toLocaleString()}
                            </span>
                          </div>

                          {/* Officer Badge */}
                          <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                            <span className="truncate max-w-[150px] font-medium">LO: {loan.loan_officer_name}</span>
                            {loan.follow_up_date && (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold">
                                FU: {loan.follow_up_date}
                              </span>
                            )}
                          </div>

                          {/* Card Quick Actions */}
                          <div
                            className="flex items-center justify-end gap-1.5 pt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setDetailLoan(loan)}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(loan)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {stageLoans.length === 0 && (
                        <div className="h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 text-center text-gray-400 bg-white/40">
                          <p className="text-xs font-semibold">No active loans in stage</p>
                          <span className="text-[10px] mt-0.5 text-gray-400">Awaiting workflow transition</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ==============================================================
             TABLE VIEW
             ============================================================== */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 font-semibold">Borrower Name</th>
                    <th className="p-4 font-semibold">Stage</th>
                    <th className="p-4 font-semibold">Transaction / Type</th>
                    <th className="p-4 font-semibold">Loan / Value</th>
                    <th className="p-4 font-semibold">Assigned Officer</th>
                    <th className="p-4 font-semibold">Processor</th>
                    <th className="p-4 font-semibold">Follow-Up</th>
                    <th className="p-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loans.map((loan) => {
                    const sc = getStageConfig(loan.stage);
                    return (
                      <tr
                        key={loan.id}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer text-gray-800"
                        onClick={() => setDetailLoan(loan)}
                      >
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{loan.client_name}</div>
                          <div className="text-xs text-gray-500">{loan.phone}</div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sc.badgeBg} ${sc.badgeText} inline-block`}
                          >
                            {sc.label}
                          </span>
                        </td>

                        <td className="p-4 text-gray-700 font-medium">
                          <div>{loan.transaction_type}</div>
                          <div className="text-xs text-gray-500">{loan.loan_type}</div>
                        </td>

                        <td className="p-4 font-bold text-gray-900">
                          ${Number(loan.loan_amount || loan.estimated_property_value || 0).toLocaleString()}
                        </td>

                        <td className="p-4 text-gray-700 font-medium">{loan.loan_officer_name}</td>
                        <td className="p-4 text-gray-500">{loan.processor_name || '—'}</td>

                        <td className="p-4 text-amber-600 font-bold">{loan.follow_up_date || '—'}</td>

                        <td
                          className="p-4 text-right space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setDetailLoan(loan)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(loan)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-between text-xs text-gray-600">
        <div>
          Showing <span className="text-gray-900 font-bold">{loans.length}</span> of{' '}
          <span className="text-gray-900 font-bold">{totalRecords}</span> applications
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-700 font-bold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-bold text-gray-800">
            Page {page} of {totalPages || 1}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-700 font-bold transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Create/Edit Modal */}
      <LoanFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialLoan={editingLoan}
        defaultPipelineType={editingLoan ? editingLoan.pipeline_type : selectedCreatePipeline}
        onSuccess={(savedLoan) => {
          fetchLoans();
          if (editingHistoryRecord) {
            setIsHistoryModalOpen(true);
          }
        }}
        editingHistoryRecord={editingHistoryRecord}
        isHidden={isHistoryModalOpen}
      />

      {/* Detail Drawer Modal */}
      <LoanDetailModal
        isOpen={!!detailLoan}
        loan={detailLoan}
        isHidden={isHistoryModalOpen}
        onViewHistory={() => {
          setHistoryLoanId(detailLoan?.id || null);
          setHistoryLoanStage(detailLoan?.stage || null);
          setIsHistoryModalOpen(true);
        }}
        onClose={() => setDetailLoan(null)}
        onEdit={(loan) => {
          setDetailLoan(null);
          setEditingLoan(loan);
          setIsFormOpen(true);
        }}
        onEditStage={(loan, targetStageCode) => {
          setDetailLoan(null);
          setEditingLoan({ ...loan, stage: targetStageCode });
          setIsFormOpen(true);
        }}
        onDelete={(loan) => handleDelete(loan)}
        onMoveStage={(loan, newStageCode) => handleStageMove(loan, newStageCode)}
      />
    </div>
  );
}
