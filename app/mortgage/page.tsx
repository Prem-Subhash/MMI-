'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Users,
  FileCheck,
  TrendingUp,
  AlertCircle,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import MortgageHeader from './components/MortgageHeader';
import { DashboardStats, MortgageLoan, PipelineType } from './lib/types';
import { getStageConfig } from './lib/stageFields';
import LoanFormModal from './components/LoanFormModal';
import CreateApplicationModal from './components/CreateApplicationModal';

export default function MortgageDashboardPage() {
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <MortgageHeader title="Moonstar Mortgage — Executive Lending Dashboard" />

      <div className="flex-1 p-8 overflow-y-auto space-y-8">
        
        {/* Top Quick Actions & Refresh Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Pipeline Command Center</h2>
            <p className="text-xs text-slate-400">Monitoring New Loan & Pre-Approval pipelines</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardStats}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh statistics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsSelectionOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Application</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ==============================================================
           EXECUTIVE KPI CARDS
           ============================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Loans
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-white">
                {stats?.totalLoans ?? '—'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">All active applications</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                New Loans
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-white">
                {stats?.newLoansCount ?? '—'}
              </div>
              <div className="text-[11px] text-purple-400 mt-1">6-Stage Loan Workflow</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pre-Approvals
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-white">
                {stats?.preApprovalsCount ?? '—'}
              </div>
              <div className="text-[11px] text-indigo-400 mt-1">2-Stage Pre-Approval</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Loans Closing
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-cyan-400">
                {stats?.loansClosingCount ?? '—'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">In CLOSING stage</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Loans in Audit
              </span>
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-pink-400">
                {stats?.loansInAuditCount ?? '—'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Final compliance review</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Upcoming Follow-Ups
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-amber-400">
                {stats?.upcomingFollowUpsCount ?? '—'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Scheduled reminders</div>
            </div>
          </div>
        </div>

        {/* ==============================================================
           VISUAL CHARTS & PIPELINE BREAKDOWN
           ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Stage Summary / Pipeline Statistics */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Stage Distribution & Volume</h3>
                <p className="text-xs text-slate-400">Breakdown of loans across all 8 pipeline stages</p>
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                Projected Revenue: ${(stats?.totalProjectedCommission || 0).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {(stats?.stageDistribution || []).map((stageItem) => {
                const maxCount = Math.max(
                  ...(stats?.stageDistribution || []).map((s) => s.count),
                  1
                );
                const widthPct = Math.max(8, (stageItem.count / maxCount) * 100);

                return (
                  <div key={stageItem.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{stageItem.name}</span>
                      <span className="text-slate-400 font-medium">
                        {stageItem.count} loans • ${stageItem.volume.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Loan Officer Summary */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-white">Loan Officer Summary</h3>
            <p className="text-xs text-slate-400">Assigned loan portfolio performance</p>

            <div className="space-y-3 pt-2">
              {(stats?.loanOfficerSummary || []).map((lo) => (
                <div
                  key={lo.name}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{lo.name}</div>
                    <div className="text-xs text-slate-400">{lo.count} assigned loans</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">
                      ${lo.commission.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">Est. Commission</div>
                  </div>
                </div>
              ))}
              {(!stats?.loanOfficerSummary || stats.loanOfficerSummary.length === 0) && (
                <p className="text-xs text-slate-500 text-center py-6">No officers assigned yet</p>
              )}
            </div>
          </div>
        </div>

        {/* ==============================================================
           TABLE SECTION: TODAY'S FOLLOW-UPS & RECENT APPLICATIONS
           ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Upcoming Follow-Ups Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Today&apos;s & Upcoming Follow-Ups</h3>
                <p className="text-xs text-slate-400">Loans requiring officer contact or review</p>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="pb-2">Client Name</th>
                    <th className="pb-2">Follow-Up Date</th>
                    <th className="pb-2">Assigned LO</th>
                    <th className="pb-2">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(stats?.upcomingFollowUps || []).map((loan) => {
                    const sc = getStageConfig(loan.stage);
                    return (
                      <tr key={loan.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 font-bold text-white">{loan.client_name}</td>
                        <td className="py-2.5 text-amber-400 font-semibold">{loan.follow_up_date}</td>
                        <td className="py-2.5 text-slate-300">{loan.loan_officer_name}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.badgeBg} ${sc.badgeText}`}
                          >
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {(!stats?.upcomingFollowUps || stats.upcomingFollowUps.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No upcoming follow-up dates scheduled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-white">Recent Applications</h3>
                <p className="text-xs text-slate-400">Latest loan and pre-approval intakes</p>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="pb-2">Borrower</th>
                    <th className="pb-2">Loan Type</th>
                    <th className="pb-2">Value</th>
                    <th className="pb-2">Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(stats?.recentApplications || []).map((loan) => {
                    const sc = getStageConfig(loan.stage);
                    return (
                      <tr key={loan.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5">
                          <div className="font-bold text-white">{loan.client_name}</div>
                          <div className="text-[10px] text-slate-400">{loan.phone}</div>
                        </td>
                        <td className="py-2.5 text-slate-300">
                          {loan.transaction_type} • {loan.loan_type}
                        </td>
                        <td className="py-2.5 font-bold text-emerald-400">
                          ${Number(loan.loan_amount || loan.estimated_property_value || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.badgeBg} ${sc.badgeText}`}
                          >
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {(!stats?.recentApplications || stats.recentApplications.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        No applications created yet. Click &quot;Create Application&quot; to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
