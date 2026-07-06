'use client'

import { useRouter } from 'next/navigation'
import { Activity, Clock, FileText, CheckCircle2, ShieldCheck, AlertCircle, ArrowLeft, UserCheck, Banknote } from 'lucide-react'

const STATIC_ACTIVITIES = [
  {
    id: 'act-01',
    type: 'STAGE_TRANSITION',
    title: 'Stage Progression: Term Sheet Received',
    description: 'American Commercial Bank & Trust issued an SBA 7a term sheet for Apex Logistics LLC ($1,450,000 acquisition).',
    timestamp: '2026-07-05 09:15 AM',
    user: 'Lending Officer (System)',
    icon: <FileText className="text-purple-600" size={18} />,
    bg: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'act-02',
    type: 'DEPOSIT_RECEIVED',
    title: 'Good Faith Deposit Confirmed',
    description: 'Received $5,000 internal good faith deposit check from Sunrise Early Education LLC.',
    timestamp: '2026-07-04 03:45 PM',
    user: 'Accounting Dept',
    icon: <Banknote className="text-emerald-600" size={18} />,
    bg: 'bg-emerald-50 border-emerald-200'
  },
  {
    id: 'act-03',
    type: 'UW_DOCUMENT',
    title: 'Underwriting Document Requested',
    description: 'Requested 3 years corporate tax returns and current YTD P&L from Midwest Health Partners.',
    timestamp: '2026-07-03 11:20 AM',
    user: 'Senior Underwriter',
    icon: <AlertCircle className="text-amber-600" size={18} />,
    bg: 'bg-amber-50 border-amber-200'
  },
  {
    id: 'act-04',
    type: 'LOAN_CLOSED',
    title: 'Loan Successfully Closed & Funded',
    description: 'Fresh Market Grocery LLC equipment financing ($410,000) check received and closing checklist completed.',
    timestamp: '2026-07-02 04:10 PM',
    user: 'Closing Attorney / Officer',
    icon: <CheckCircle2 className="text-green-600" size={18} />,
    bg: 'bg-green-50 border-green-200'
  },
  {
    id: 'act-05',
    type: 'NEW_APPLICATION',
    title: 'New Loan Application Submitted',
    description: 'GreenLeaf Dispensary Co submitted new $650,000 start-up inquiry via Loan Officer referral.',
    timestamp: '2026-07-01 10:00 AM',
    user: 'Intake Portal',
    icon: <UserCheck className="text-[#10B889]" size={18} />,
    bg: 'bg-emerald-50 border-emerald-200'
  }
]

export default function LendingActivityLogPage() {
  const router = useRouter()

  return (
    <div className="w-full space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <button
            onClick={() => router.push('/lending/dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#10B889] hover:text-[#2E5C85] uppercase tracking-widest mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="text-[#10B889]" />
            <span>Underwriting Activity Feed</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Audit trail of loan stage transitions, document verifications, and good faith deposits.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white rounded-xl text-xs font-bold shadow-sm">
          <ShieldCheck size={16} className="text-white/90" />
          <span>Static UI Prototype Feed</span>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flow-root">
          <ul className="-mb-8">
            {STATIC_ACTIVITIES.map((act, idx) => {
              const isLast = idx === STATIC_ACTIVITIES.length - 1
              return (
                <li key={act.id}>
                  <div className="relative pb-8">
                    {!isLast ? (
                      <span className="absolute left-6 top-6 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex items-start space-x-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm ${act.bg}`}>
                        {act.icon}
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-base font-extrabold text-slate-900">{act.title}</p>
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed">{act.description}</p>
                          <div className="mt-2 flex items-center gap-3 text-xs font-semibold text-slate-500">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">By: {act.user}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {act.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
