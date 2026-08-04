'use client';

import React, { useEffect, useState } from 'react';
import { History, ArrowDown, User, Calendar, MessageSquare, Eye, X, ShieldCheck, Building2, Edit3 } from 'lucide-react';
import { MortgageStageHistory, StageCode } from '@/app/mortgage/lib/types';
import { getStageConfig } from '@/app/mortgage/lib/stageFields';
import { toast } from '@/lib/toast';

interface StageHistorySectionProps {
  loanId: string;
  currentStage: StageCode;
  onEditHistory?: (record: MortgageStageHistory) => void;
}

export default function StageHistorySection({ loanId, currentStage, onEditHistory }: StageHistorySectionProps) {
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
        if (isMounted) toast('Failed to load stage history.', 'error');
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
      return <span className="text-slate-400 italic font-medium">— (Not Entered)</span>;
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
    <div className="mt-6 border-t border-gray-200 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-[#10B889]" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#10B889]">
          Stage History & Snapshots (Read-Only)
        </h3>
      </div>

      {loading ? (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center gap-2.5 text-xs text-gray-600 font-semibold">
          <div className="w-4 h-4 border-2 border-[#10B889] border-t-transparent rounded-full animate-spin" />
          <span>Loading stage progression records...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500 font-medium">
          No stage transition history recorded yet for this application.
        </div>
      ) : (
        <div className="space-y-3.5">
          {history.map((record) => {
            const prevConfig = getStageConfig(record.previous_stage as StageCode);
            const currConfig = getStageConfig(record.current_stage as StageCode);

            return (
              <div
                key={record.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
              >
                <div className="bg-emerald-50/50 px-5 py-3 border-b border-emerald-100 flex items-center justify-between">
                  <h3 className="font-bold text-emerald-700">{currConfig.label || record.current_stage}</h3>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                    {new Date(record.changed_at || Date.now()).toLocaleString()}
                  </span>
                </div>



                <div className="p-5 space-y-3 text-gray-800">
                {/* Stage Transition & Action */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col items-start gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${prevConfig.badgeBg} ${prevConfig.badgeText}`}
                    >
                      Previous: {prevConfig.label || record.previous_stage}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onEditHistory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditHistory(record);
                        }}
                        className="p-1.5 text-gray-400 hover:text-[#2E5C85] hover:bg-[#2E5C85]/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                        title="Edit Historical Stage Data"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedSnapshot(record)}
                      className="p-1.5 text-gray-400 hover:text-[#2E5C85] hover:bg-[#2E5C85]/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                      title="View Snapshot"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      toast(`Viewing snapshot from ${formatTimestamp(record.changed_at)}`, 'info', 2000);
                      setSelectedSnapshot(record);
                    }}
                    className="h-9 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-2xs active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>View Snapshot</span>
                  </button>
                </div>

                <div className="p-5 space-y-3 text-gray-800">
                  {/* Stage Transition & Action */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${prevConfig.badgeBg} ${prevConfig.badgeText}`}
                      >
                        Previous: {prevConfig.label || record.previous_stage}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {onEditHistory && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditHistory(record);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#2E5C85] hover:bg-[#2E5C85]/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                          title="Edit Historical Stage Data"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedSnapshot(record)}
                        className="p-1.5 text-gray-400 hover:text-[#2E5C85] hover:bg-[#2E5C85]/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                        title="View Snapshot"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    </div>
                  </div>

                  {/* Date & Time & Updated By */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 font-medium">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{formatTimestamp(record.changed_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#2E5C85] font-bold">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>Updated by: {record.updated_by || 'Mortgage Admin'}</span>
                    </div>
                  </div>
                )}


                  {/* Remarks if provided */}
                  {record.remarks && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-[#10B889] shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{record.remarks}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Immutable Snapshot Details Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 text-gray-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="shrink-0 p-6 bg-slate-50 border-b border-gray-100 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Snapshot Record
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#2E5C85]">
                    {getStageConfig(selectedSnapshot.current_stage as StageCode).label}
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Immutable history snapshot captured on {formatTimestamp(selectedSnapshot.changed_at)} by{' '}
                  <span className="text-gray-800 font-bold">{selectedSnapshot.updated_by}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSnapshot(null)}
                className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200"
                aria-label="Close snapshot modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Table / Grid */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 font-medium shadow-sm">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#10B889]" />
                <span>
                  This snapshot displays the exact values saved at the time of this transition. It never changes when the live loan is updated.
                </span>
              </div>

              {selectedSnapshot.stage_data && Object.keys(selectedSnapshot.stage_data).filter(k => !k.startsWith('_')).length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white shadow-sm">
                  {Object.entries(selectedSnapshot.stage_data)
                    .filter(([key]) => !key.startsWith('_'))
                    .map(([key, val]) => (
                      <div key={key} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-xs hover:bg-gray-50/80 transition-colors">
                        <span className="font-semibold text-gray-600 shrink-0 sm:w-1/3 uppercase tracking-wider text-[11px]">
                          {formatFieldLabel(key)}
                        </span>
                        <span className="text-gray-900 font-bold sm:text-right break-all">
                          {formatFieldValue(val)}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-gray-500 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  No detailed field snapshot values were recorded for this transition.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4 sm:px-8 flex items-center justify-end gap-3 shadow-sm">
              <button
                type="button"
                onClick={() => setSelectedSnapshot(null)}
                className="h-10 min-w-[160px] px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all active:scale-95 text-xs sm:text-sm flex items-center justify-center shadow-2xs"
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
