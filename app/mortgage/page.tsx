'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Building2,
  DollarSign,
  ArrowUpRight,
  Layers,
  Calendar,
  FileCheck,
  RefreshCw,
  Users
} from 'lucide-react';
import { DashboardStats, MortgageLoan, PipelineType } from './lib/types';
import { getStageConfig } from './lib/stageFields';
import LoanFormModal from './components/LoanFormModal';
import CreateApplicationModal from './components/CreateApplicationModal';

export default function MortgageDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPipelineType, setSelectedPipelineType] = useState<PipelineType>('NEW_LOAN');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/mortgage/dashboard');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load dashboard statistics');
      }
      setStats(json.stats);
    } catch (err: any) {
      setError(err.message || 'Error fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Check query parameter for automatic modal trigger from quick actions
  useEffect(() => {
    if (searchParams?.get('action') === 'new_application') {
      setIsSelectionOpen(true);
      // Clean up URL parameter cleanly
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  return (
    <div className="w-full space-y-8 animate-fade-in pb-12">

      {/* Header / Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#10B889]/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B889] mb-1">
            <Building2 size={14} />
            <span>Moonstar Lending Module</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
            Moonstar Mortgage Dashboard
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Monitor residential and commercial loan pipelines, pre-approvals, and closing checklists with precision.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto z-10">
          <button
            type="button"
            onClick={fetchDashboardStats}
            className="h-10 w-10 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 transition-all flex items-center justify-center shadow-2xs shrink-0 active:scale-95"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#10B889]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsSelectionOpen(true)}
            className="h-10 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 group whitespace-nowrap text-xs sm:text-sm active:scale-95"
          >
            <PlusCircle size={16} className="transition-transform group-hover:rotate-90 shrink-0" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Metric Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] flex items-center gap-2">
            <TrendingUp size={18} className="text-[#10B889]" />
            <span>Executive KPI Overview</span>
          </h2>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
            Projected Revenue: ${(stats?.totalProjectedCommission || 0).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          <MetricCard
            title="Total Loans"
            value={stats?.totalLoans?.toString() ?? '—'}
            subtitle="All active portfolios"
            icon={<Layers size={24} className="text-blue-600" />}
            trend="Active Queue"
            onClick={() => router.push('/mortgage/pipeline/new-loan')}
          />
          <MetricCard
            title="New Loans"
            value={stats?.newLoansCount?.toString() ?? '—'}
            subtitle="6-Stage Loan Workflow"
            icon={<PlusCircle size={24} className="text-purple-600" />}
            trend="Origination"
            onClick={() => router.push('/mortgage/pipeline/new-loan')}
          />
          <MetricCard
            title="Pre-Approvals"
            value={stats?.preApprovalsCount?.toString() ?? '—'}
            subtitle="2-Stage Verification"
            icon={<FileCheck size={24} className="text-indigo-600" />}
            trend="Screening"
            onClick={() => router.push('/mortgage/pipeline/pre-approval')}
          />
          <MetricCard
            title="Loans Closing"
            value={stats?.loansClosingCount?.toString() ?? '—'}
            subtitle="Stage 5 Closing"
            icon={<CheckCircle2 size={24} className="text-teal-600" />}
            trend="Disbursement"
            onClick={() => router.push('/mortgage/pipeline/new-loan')}
          />
          <MetricCard
            title="Loans in Audit"
            value={stats?.loansInAuditCount?.toString() ?? '—'}
            subtitle="Stage 4 Audit"
            icon={<AlertCircle size={24} className="text-pink-600" />}
            trend="Compliance"
            onClick={() => router.push('/mortgage/pipeline/new-loan')}
          />
          <MetricCard
            title="Follow-Ups"
            value={stats?.upcomingFollowUpsCount?.toString() ?? '—'}
            subtitle="Scheduled contacts"
            icon={<Calendar size={24} className="text-amber-600" />}
            trend="Action Required"
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Stage Distribution & Revenue Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-gray-900">Stage Distribution & Volume Analysis</h3>
            <p className="text-xs text-gray-500">Breakdown of loans and volume across all pipeline stages</p>
          </div>
          <span className="text-xs font-bold text-[#10B889] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block w-fit shadow-sm">
            Total Pipeline Volume: ${(stats?.stageDistribution || []).reduce((acc, s) => acc + s.volume, 0).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pt-2">
          {(stats?.stageDistribution || []).map((stageItem) => {
            const maxCount = Math.max(
              ...(stats?.stageDistribution || []).map((s) => s.count),
              1
            );
            const widthPct = Math.max(8, (stageItem.count / maxCount) * 100);

            return (
              <div key={stageItem.stage} className="space-y-1.5 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-800">{stageItem.name}</span>
                  <span className="text-gray-600 font-semibold">
                    {stageItem.count} loans • ${stageItem.volume.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#10B889] to-[#2E5C85] rounded-full transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tables Grid: Today's Follow-Ups & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming Follow-Ups Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Scheduled Follow-Ups</h3>
              <p className="text-xs text-gray-500 mt-0.5">Loans requiring loan officer review and contact</p>
            </div>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
              {stats?.upcomingFollowUps?.length || 0} Scheduled
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Client Name</th>
                  <th className="px-5 py-3.5 font-semibold">Follow-Up Date</th>
                  <th className="px-5 py-3.5 font-semibold">Assigned LO</th>
                  <th className="px-5 py-3.5 font-semibold">Current Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(stats?.upcomingFollowUps || []).map((loan) => {
                  const sc = getStageConfig(loan.stage);
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50/80 transition-colors text-gray-800">
                      <td className="px-5 py-4 font-bold text-gray-900">{loan.client_name}</td>
                      <td className="px-5 py-4 text-amber-600 font-bold">{loan.follow_up_date}</td>
                      <td className="px-5 py-4 text-gray-600 font-medium">{loan.loan_officer_name}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border ${sc.badgeBg} ${sc.badgeText} inline-block`}>
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!stats?.upcomingFollowUps || stats.upcomingFollowUps.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500 font-medium">
                      No upcoming follow-up dates scheduled.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Recent Applications</h3>
              <p className="text-xs text-gray-500 mt-0.5">Latest residential and commercial intakes</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/mortgage/pipeline/new-loan')}
              className="h-8 px-3 py-1.5 rounded-lg text-xs font-bold text-[#2E5C85] bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center gap-1 uppercase tracking-wider transition-colors shadow-2xs shrink-0"
            >
              <span>Kanban Board</span>
              <ArrowUpRight size={14} className="shrink-0" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white text-xs uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Borrower</th>
                  <th className="px-5 py-3.5 font-semibold">Loan Type</th>
                  <th className="px-5 py-3.5 font-semibold">Value</th>
                  <th className="px-5 py-3.5 font-semibold">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(stats?.recentApplications || []).map((loan) => {
                  const sc = getStageConfig(loan.stage);
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50/80 transition-colors group text-gray-800">
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900">{loan.client_name}</div>
                        <div className="text-xs text-gray-500">{loan.phone}</div>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-700">
                        {loan.transaction_type} • {loan.loan_type}
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900">
                        ${Number(loan.loan_amount || loan.estimated_property_value || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border ${sc.badgeBg} ${sc.badgeText} inline-block`}>
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!stats?.recentApplications || stats.recentApplications.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500 font-medium">
                      No applications created yet. Click &quot;New Application&quot; to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals for Loan Creation / Editing */}
      <CreateApplicationModal
        isOpen={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        onSelectPipeline={(pipeline) => {
          setSelectedPipelineType(pipeline);
          setIsSelectionOpen(false);
          setIsFormOpen(true);
        }}
      />

      <LoanFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => fetchDashboardStats()}
        defaultPipelineType={selectedPipelineType}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  onClick
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer h-full rounded-xl p-5 flex flex-col justify-between bg-white border border-gray-200 hover:border-[#2E5C85] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1 truncate">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight truncate">{value}</h3>
        </div>
        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 group-hover:scale-110 transition-transform shrink-0">
          {icon}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium gap-2">
        <span className="text-gray-600 truncate mr-1">{subtitle}</span>
        <span className="font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200 shrink-0">{trend}</span>
      </div>
    </div>
  );
}
