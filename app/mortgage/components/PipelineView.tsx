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
import CreateApplicationModal from './CreateApplicationModal';

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
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [selectedCreatePipeline, setSelectedCreatePipeline] = useState<PipelineType>(pipelineType);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<MortgageLoan | null>(null);
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
    <div className="flex-1 flex flex-col min-h-0">
      
      {/* Top Action & Search Bar */}
      <div className="p-6 pb-4 border-b border-slate-800 bg-slate-900/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLoans()}
              placeholder="Search by client name, email, phone, officer..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* View Switcher & New Loan Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode('KANBAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'KANBAN'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>

              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'TABLE'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <button
              onClick={() => {
                setEditingLoan(null);
                setIsSelectionOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Application</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar (ONLY Stage Filter As Requested) */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
          <span className="flex items-center gap-1 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white">Filter by Stage:</span>
          </span>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Stages ({pipelineStages.length})</option>
            {pipelineStages.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2 text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none"
            >
              <option value="updated_at">Last Updated</option>
              <option value="created_at">Date Created</option>
              <option value="client_name">Client Name</option>
              <option value="estimated_property_value">Property Value</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-700 font-semibold"
            >
              {sortOrder === 'asc' ? 'ASC ↑' : 'DESC ↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading Moonstar Mortgage Pipeline...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-center">
            <p>{error}</p>
            <button
              onClick={fetchLoans}
              className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        ) : loans.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl">
            <FolderOpen className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-white">No applications found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              No applications match your current filters. Click &quot;Create Application&quot; to add a new borrower.
            </p>
            <button
              onClick={() => {
                setEditingLoan(null);
                setIsSelectionOpen(true);
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create Application</span>
            </button>
          </div>
        ) : viewMode === 'KANBAN' ? (
          /* ==============================================================
             KANBAN BOARD VIEW
             ============================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pb-6 min-w-max">
            {pipelineStages.map((stageItem) => {
              const stageLoans = loans.filter((l) => l.stage === stageItem.code);

              return (
                <div
                  key={stageItem.code}
                  className="w-80 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col max-h-[calc(100vh-280px)] overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stageItem.color }}
                      />
                      <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                        {stageItem.label}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs font-bold text-slate-300">
                      {stageLoans.length}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {stageLoans.map((loan) => (
                      <div
                        key={loan.id}
                        className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col gap-2.5 cursor-pointer shadow-sm group"
                        onClick={() => setDetailLoan(loan)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                              {loan.client_name}
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              {loan.transaction_type} • {loan.loan_type}
                            </span>
                          </div>

                          <span className="text-xs font-bold text-emerald-400 shrink-0">
                            ${Number(loan.loan_amount || loan.estimated_property_value || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Officer Badge */}
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-700/50">
                          <span className="truncate max-w-[140px]">LO: {loan.loan_officer_name}</span>
                          {loan.follow_up_date && (
                            <span className="text-[10px] text-amber-400 font-medium">
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
                            onClick={() => {
                              setEditingLoan(loan);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(loan)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==============================================================
             TABLE VIEW
             ============================================================== */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Borrower Name</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4">Transaction / Type</th>
                    <th className="p-4">Loan / Value</th>
                    <th className="p-4">Assigned Officer</th>
                    <th className="p-4">Processor</th>
                    <th className="p-4">Follow-Up</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {loans.map((loan) => {
                    const sc = getStageConfig(loan.stage);
                    return (
                      <tr
                        key={loan.id}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setDetailLoan(loan)}
                      >
                        <td className="p-4">
                          <div className="font-bold text-white">{loan.client_name}</div>
                          <div className="text-xs text-slate-400">{loan.phone}</div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border ${sc.badgeBg} ${sc.badgeText}`}
                          >
                            {sc.label}
                          </span>
                        </td>

                        <td className="p-4 text-slate-300">
                          <div>{loan.transaction_type}</div>
                          <div className="text-xs text-slate-400">{loan.loan_type}</div>
                        </td>

                        <td className="p-4 font-bold text-emerald-400">
                          ${Number(loan.loan_amount || loan.estimated_property_value || 0).toLocaleString()}
                        </td>

                        <td className="p-4 text-slate-300">{loan.loan_officer_name}</td>
                        <td className="p-4 text-slate-400">{loan.processor_name || '—'}</td>

                        <td className="p-4 text-slate-300">{loan.follow_up_date || '—'}</td>

                        <td
                          className="p-4 text-right space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setEditingLoan(loan);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(loan)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
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
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="text-white font-semibold">{loans.length}</span> of{' '}
          <span className="text-white font-semibold">{totalRecords}</span> applications
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-white">
            Page {page} of {totalPages || 1}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pipeline Selection Modal */}
      <CreateApplicationModal
        isOpen={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        onSelectPipeline={(pipeline) => {
          setSelectedCreatePipeline(pipeline);
          setEditingLoan(null);
          setIsSelectionOpen(false);
          setIsFormOpen(true);
        }}
      />

      {/* Dynamic Create/Edit Modal */}
      <LoanFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialLoan={editingLoan}
        defaultPipelineType={editingLoan ? editingLoan.pipeline_type : selectedCreatePipeline}
        onSuccess={(savedLoan) => {
          fetchLoans();
        }}
      />

      {/* Detail Drawer Modal */}
      <LoanDetailModal
        isOpen={!!detailLoan}
        loan={detailLoan}
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
