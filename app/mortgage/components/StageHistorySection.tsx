'use client';

import React, { useEffect, useState } from 'react';
import { History, ArrowDown, User, Calendar, MessageSquare, Eye, X, ShieldCheck } from 'lucide-react';
import { MortgageStageHistory, StageCode } from '@/app/mortgage/lib/types';
import { getStageConfig } from '@/app/mortgage/lib/stageFields';

interface StageHistorySectionProps {
  loanId: string;
  currentStage: StageCode;
}

export default function StageHistorySection({ loanId, currentStage }: StageHistorySectionProps) {
  const [history, setHistory] = useState<MortgageStageHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MortgageStageHistory | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/mortgage/loans/${loanId}/history`);
        const json = await res.json();
        if (isMounted && res.ok && json.success) {
          setHistory(json.history || []);
        }
      } catch (err) {
        console.error('Failed to fetch stage history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (loanId) {
      fetchHistory();
    }
    return () => {
      isMounted = false;
    };
  }, [loanId, currentStage]);

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatFieldLabel = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatFieldValue = (val: any) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-500 italic">— (Not Entered)</span>;
    }
    if (typeof val === 'boolean') {
      return val ? 'Yes' : 'No';
    }
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    // Format numeric values cleanly
    if (typeof val === 'number') {
      return val.toLocaleString('en-US');
    }
    return String(val);
  };

  return (
    <div className="mt-6 border-t border-slate-800 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Stage History & Snapshots (Read-Only)
        </h3>
      </div>

      {loading ? (
        <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-400">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading stage progression records...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-xl text-center text-xs text-slate-500 italic">
          No stage transition history recorded yet for this application.
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((record) => {
            const prevConfig = getStageConfig(record.previous_stage as StageCode);
            const currConfig = getStageConfig(record.current_stage as StageCode);

            return (
              <div
                key={record.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 transition-all hover:border-slate-700"
              >
                {/* Stage Transition & Action */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${prevConfig.badgeBg} ${prevConfig.badgeText}`}
                    >
                      {prevConfig.label || record.previous_stage}
                    </span>
                    <div className="pl-3 py-0.5 text-slate-400 font-bold text-xs flex items-center gap-1">
                      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currConfig.badgeBg} ${currConfig.badgeText}`}
                    >
                      {currConfig.label || record.current_stage}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSnapshot(record)}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                </div>

                {/* Date & Time & Updated By */}
                <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatTimestamp(record.changed_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>Updated by: {record.updated_by || 'Mortgage Admin'}</span>
                  </div>
                </div>

                {/* Remarks if provided */}
                {record.remarks && (
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span className="whitespace-pre-wrap">{record.remarks}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Immutable Snapshot Details Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Stage Snapshot Details — {getStageConfig(selectedSnapshot.current_stage as StageCode).label}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Immutable history snapshot captured on {formatTimestamp(selectedSnapshot.changed_at)} by{' '}
                  <span className="text-blue-400 font-semibold">{selectedSnapshot.updated_by}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSnapshot(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Table / Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  This snapshot displays the exact values saved at the time of this transition. It never changes when the live loan is updated.
                </span>
              </div>

              {selectedSnapshot.stage_data && Object.keys(selectedSnapshot.stage_data).filter(k => !k.startsWith('_')).length > 0 ? (
                <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 bg-slate-950/40">
                  {Object.entries(selectedSnapshot.stage_data)
                    .filter(([key]) => !key.startsWith('_'))
                    .map(([key, val]) => (
                      <div key={key} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-xs">
                        <span className="font-semibold text-slate-400 shrink-0 sm:w-1/3">
                          {formatFieldLabel(key)}
                        </span>
                        <span className="text-slate-200 font-medium sm:text-right break-all">
                          {formatFieldValue(val)}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-950/30 rounded-xl border border-slate-800/60">
                  No detailed field snapshot values were recorded for this transition.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Snapshot View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
