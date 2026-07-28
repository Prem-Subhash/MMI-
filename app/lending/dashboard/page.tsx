'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Building2,
  ArrowUpRight
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { LENDING_STAGES } from '@/app/lending/lib/constants'

export default function LendingDashboardPage() {
  const router = useRouter()
  const [loans, setLoans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/lending/loans?limit=100')
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
    fetchLoans()
  }, [])

  // Metrics
  const getStageIdx = (loan: any) => LENDING_STAGES.indexOf(loan.current_stage || LENDING_STAGES[0]) + 1
  const newLoansCount = loans.filter(l => { const idx = getStageIdx(l); return idx >= 1 && idx <= 3 }).length
  const underReviewCount = loans.filter(l => { const idx = getStageIdx(l); return idx === 4 || idx === 9 }).length
  const termSheetsCount = loans.filter(l => { const idx = getStageIdx(l); return idx === 5 }).length
  const closingCount = loans.filter(l => { const idx = getStageIdx(l); return idx >= 10 && idx <= 12 }).length

  return (
    <div className="w-full space-y-8 animate-fade-in pb-12">
      {/* Header / Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#10B889]/10 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B889] mb-1">
            <Building2 size={14} />
            <span>Commercial Finance Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Accurate Lending Dashboard
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">
            Monitor commercial loan pipelines, term sheets, and closing workflows in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto z-10">
          <button
            onClick={() => router.push('/lending/loans/new')}
            className="w-full sm:w-auto bg-[#10B889] hover:bg-[#0c966f] text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group whitespace-nowrap"
          >
            <PlusCircle size={20} className="transition-transform group-hover:rotate-90" />
            <span>New Loan Application</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-500">Loading dashboard data...</div>
      ) : (
        <>
          {/* Metric Cards Section */}
          <div>
            <h2 className="text-base font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#10B889]" />
              <span>Pipeline Overview</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <MetricCard
                title="New Loans"
                value={newLoansCount.toString()}
                subtitle="Inquiries & intake queue"
                icon={<PlusCircle size={24} className="text-blue-600" />}
                bgClass="bg-blue-50/60 border-blue-200/80 hover:border-blue-400"
                trend="Stages 1-3"
                onClick={() => router.push('/lending/pipeline')}
              />
              <MetricCard
                title="Under Review"
                value={underReviewCount.toString()}
                subtitle="Initial screening & UW"
                icon={<Clock size={24} className="text-amber-600" />}
                bgClass="bg-amber-50/60 border-amber-200/80 hover:border-amber-400"
                trend="Stages 4 & 9"
                onClick={() => router.push('/lending/pipeline')}
              />
              <MetricCard
                title="Term Sheets Received"
                value={termSheetsCount.toString()}
                subtitle="Awaiting borrower commitment"
                icon={<FileText size={24} className="text-purple-600" />}
                bgClass="bg-purple-50/60 border-purple-200/80 hover:border-purple-400"
                trend="Stage 5"
                onClick={() => router.push('/lending/pipeline')}
              />
              <MetricCard
                title="Closing in Process"
                value={closingCount.toString()}
                subtitle="Checklist & bank deposits"
                icon={<CheckCircle2 size={24} className="text-teal-600" />}
                bgClass="bg-teal-50/60 border-teal-200/80 hover:border-teal-400"
                trend="Stages 10-12"
                onClick={() => router.push('/lending/pipeline')}
              />
            </div>
          </div>

          {/* Recent Sample Loan Applications Table */}
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recent Commercial Applications</h3>
                <p className="text-xs text-slate-500 mt-0.5">Most recently updated borrower files in the underwriting queue</p>
              </div>
              <button
                onClick={() => router.push('/lending/pipeline')}
                className="text-xs font-bold text-[#10B889] hover:text-[#0c966f] flex items-center gap-1 uppercase tracking-wider transition-colors"
              >
                <span>View Pipeline</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white text-xs uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Borrower Name</th>
                    <th className="px-6 py-4 font-semibold">Loan Type</th>
                    <th className="px-6 py-4 font-semibold">Purpose</th>
                    <th className="px-6 py-4 font-semibold">Purchase Price</th>
                    <th className="px-6 py-4 font-semibold">Current Stage</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {loans.slice(0, 5).map(loan => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-900">{loan.borrower_name}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{loan.loan_type}</td>
                      <td className="px-6 py-4 text-slate-600">{loan.loan_purpose}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                         {loan.purchase_price ? `$${Number(loan.purchase_price).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-gray-100 border border-gray-200 text-gray-700 inline-block">
                          {loan.current_stage || LENDING_STAGES[0]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => router.push(`/lending/loans/${loan.id}`)}
                          className="text-xs font-bold text-[#10B889] hover:text-[#0c966f] uppercase tracking-wide"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No loans found. Create a new application to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  bgClass,
  trend,
  onClick
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  bgClass: string
  trend: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-2xl p-6 flex flex-col justify-between
        border transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 group
        ${bgClass}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between text-[10px] sm:text-xs font-medium">
        <span className="text-slate-600">{subtitle}</span>
        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md shadow-2xs border border-gray-200 uppercase">{trend}</span>
      </div>
    </div>
  )
}
